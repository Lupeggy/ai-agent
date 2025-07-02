import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import {
    CallEndedEvent,
    CallTranscriptionReadyEvent,
    CallSessionParticipantLeftEvent,
    CallRecordingReadyEvent,
    CallSessionParticipantJoinedEvent,
    CallSessionStartedEvent,
} from "@stream-io/node-sdk";

import { db } from "@/db";
import { agent, meeting } from "@/db/schemas";
import { streamVideo } from "@/lib/stream-video-server";

function verifySignature(body: string, signature: string): boolean {
    return streamVideo.verifyWebhook(body, signature);
};

export async function POST(req: NextRequest) {
    console.log("📥 Webhook received");
    const signature = req.headers.get("x-signature");
    const apiKey = req.headers.get("x-api-key");
    
    if (!signature || !apiKey) {
        console.error("❌ Missing signature or API key in webhook request");
        return NextResponse.json(
            { error: "Missing signature or API key" }, 
            { status: 400 });
    }
    
    const body = await req.text();

    if (!verifySignature(body, signature)) {
        console.error("❌ Invalid signature in webhook request");
        return NextResponse.json(
            { error: "Invalid signature" }, 
            { status: 401 });
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body);
    } catch (error) {
        console.error("❌ Invalid JSON payload in webhook request", error);
        return NextResponse.json(
            { error: "Invalid payload" }, 
            { status: 400 });
    }

    const eventType = (payload as Record<string, unknown>)?.type;
    console.log(`📣 Webhook event type: ${eventType}`);

    if (eventType === "call.session_started") {
        console.log("🔔 Webhook received call.session_started event");
        const event = payload as CallSessionStartedEvent;
        const meetingId = event.call.custom?.meetingId;
        console.log("📋 Meeting data in webhook:", event.call.custom);

        if (!meetingId) {
            console.error("❌ Missing meetingId in webhook event custom data");
            console.error("Event data:", JSON.stringify(event, null, 2));
            return NextResponse.json(
                { error: "Missing meeting ID" }, 
                { status: 400 });        
        }
        console.log(`✅ Found meetingId: ${meetingId}`);
        
        // Query the database for the meeting
        console.log(`🔍 Looking for meeting with ID: ${meetingId}`);
        const [existingMeeting] = await db
            .select()
            .from(meeting)
            .where(
                eq(meeting.id, meetingId)
            );

        if (!existingMeeting) {
            console.error(`❌ Meeting with ID ${meetingId} not found or has invalid status`);
            return NextResponse.json(
                { error: "Meeting not found" }, 
                { status: 404 });
        }
        console.log(`✅ Found meeting in database:`, { 
            id: existingMeeting.id, 
            name: existingMeeting.name,
            agentId: existingMeeting.agentId,
            status: existingMeeting.status
        });

        // Update meeting status to active
        await db
            .update(meeting)
            .set({ 
                status: "active",
                startedAt: new Date(),
            })
            .where(eq(meeting.id, existingMeeting.id));

        // Get the agent associated with this meeting
        console.log(`🤖 Looking for agent with ID: ${existingMeeting.agentId}`);
        if (!existingMeeting.agentId) {
            console.error(`❌ Meeting has no associated agentId!`);
            return NextResponse.json(
                { error: "Meeting has no associated AI agent" }, 
                { status: 400 });
        }
        
        const [updatedAgent] = await db
            .select()
            .from(agent)
            .where(eq(agent.id, existingMeeting.agentId));

        if (!updatedAgent) {
            console.error(`❌ Agent with ID ${existingMeeting.agentId} not found in database`);
            return NextResponse.json(
                { error: "Agent not found" }, 
                { status: 404 });
        }
        
        console.log(`✅ Found agent in database:`, { 
            id: updatedAgent.id, 
            name: updatedAgent.name,
            userId: updatedAgent.userId,
            hasInstructions: !!updatedAgent.instructions
        });

        try {
            // Check if OpenAI API key is available
            if (!process.env.OPENAI_API_KEY) {
                console.error(`❌ Missing OPENAI_API_KEY environment variable`);
                return NextResponse.json(
                    { error: "Missing OpenAI API key" }, 
                    { status: 500 });
            }
            
            console.log(`🔄 Connecting AI agent to call...`);
            // Connect the AI agent to the call
            const call = streamVideo.video.call('default', meetingId);
            const realtimeClient = await streamVideo.video.connectOpenAi({
                call,
                openAiApiKey: process.env.OPENAI_API_KEY,
                agentUserId: updatedAgent.userId,
            });

            // Update the AI agent's instructions
            console.log(`📝 Setting AI agent instructions...`);
            realtimeClient.updateSession({
                instructions: updatedAgent.instructions,
            });
            
            console.log(`✅ AI agent ${updatedAgent.name} successfully joined meeting ${meetingId}`);
            return NextResponse.json({ status: "ok", message: "AI agent joined the call" });
        } catch (error) {
            console.error(`❌ Error connecting AI agent to call:`, error);
            return NextResponse.json(
                { error: "Failed to connect AI agent to call" },
                { status: 500 }
            );
        }

    } else if (eventType === "call.session_participant_left") {
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.session_id;
        
        if (!meetingId) {   
            return NextResponse.json({ error: "Missing meeting ID" }, { status: 400 });
        }

        try {
            // End the call when a participant leaves
            const call = streamVideo.video.call('default', meetingId);
            await call.end();
            
            // Update meeting status to completed
            await db
                .update(meeting)
                .set({ 
                    status: "completed",
                    endedAt: new Date(),
                })
                .where(eq(meeting.id, meetingId));
                
            return NextResponse.json({ status: "ok", message: "Call ended successfully" });
        } catch (error) {
            console.error("Error ending call:", error);
            return NextResponse.json(
                { error: "Failed to end call" },
                { status: 500 }
            );
        }
    } else if (eventType === "call.ended") {
        const event = payload as CallEndedEvent;
        const meetingId = event.call.custom?.meetingId;
        
        if (meetingId) {
            // Update meeting status to completed
            await db
                .update(meeting)
                .set({ 
                    status: "completed",
                    endedAt: new Date(),
                })
                .where(eq(meeting.id, meetingId));
        }
    }

    // Handle transcription events to ensure AI agent responds verbally
    if (eventType === "call.transcription_ready") {
        const event = payload as any;
        const meetingId = event.session_id;
        const text = event.transcription?.text;
        const userId = event.transcription?.user?.id;
        
        console.log(`📝 Transcription received from user ${userId}: ${text}`);
        
        if (!meetingId || !text || !userId) {
            console.error("❌ Missing data in transcription event", { meetingId, text, userId });
            return NextResponse.json({ status: "ok" }); // Still return OK to avoid webhook failures
        }
        
        try {
            // Get the meeting to find the associated agent
            const [existingMeeting] = await db
                .select()
                .from(meeting)
                .where(eq(meeting.id, meetingId));
                
            if (!existingMeeting || !existingMeeting.agentId) {
                console.error(`❌ Meeting not found or has no agent: ${meetingId}`);
                return NextResponse.json({ status: "ok" });
            }
            
            // Connect to the call and update the AI agent's instructions to respond verbally
            console.log(`🔄 Updating AI agent instructions for verbal response...`);
            const call = streamVideo.video.call('default', meetingId);
            const realtimeClient = await streamVideo.video.connectOpenAi({
                call,
                openAiApiKey: process.env.OPENAI_API_KEY || '',
                agentUserId: existingMeeting.agentId,
            });
            
            // Update the AI agent's instructions with explicit verbal response requirement
            console.log(`📝 Setting AI agent instructions with verbal response requirement...`);
            realtimeClient.updateSession({
                instructions: `${existingMeeting.agentId} IMPORTANT: You must respond VERBALLY to the user. The user just said: "${text}". Respond conversationally and naturally. Always use your voice to respond, not text. This is critical: YOU MUST RESPOND VERBALLY.`,
            });
            
            console.log(`✅ AI agent instructions updated for verbal response`);
            return NextResponse.json({ status: "ok", message: "AI agent instructions updated" });
        } catch (error) {
            console.error(`❌ Error updating AI agent instructions:`, error);
            return NextResponse.json({ status: "ok" }); // Still return OK to avoid webhook failures
        }
    }
    
    // Handle internal call transcription_started events
    if (eventType === "call.transcription_started") {
        const event = payload as any;
        const meetingId = event.session_id;
        
        if (!meetingId) {
            console.error("❌ Missing meetingId in transcription_started event");
            return NextResponse.json({ status: "ok" });
        }
        
        try {
            // Get the meeting to find the associated agent
            const [existingMeeting] = await db
                .select()
                .from(meeting)
                .where(eq(meeting.id, meetingId));
                
            if (!existingMeeting || !existingMeeting.agentId) {
                console.error(`❌ Meeting not found or has no agent: ${meetingId}`);
                return NextResponse.json({ status: "ok" });
            }
            
            // Connect to the call and update the AI agent's instructions to introduce itself
            console.log(`🔄 Updating AI agent instructions for introduction...`);
            const call = streamVideo.video.call('default', meetingId);
            const realtimeClient = await streamVideo.video.connectOpenAi({
                call,
                openAiApiKey: process.env.OPENAI_API_KEY || '',
                agentUserId: existingMeeting.agentId,
            });
            
            // Update the AI agent's instructions with explicit verbal response requirement
            console.log(`📝 Setting AI agent instructions to introduce itself...`);
            realtimeClient.updateSession({
                instructions: `${existingMeeting.agentId} IMPORTANT: You must respond VERBALLY to the user. Introduce yourself and welcome the user to the call. Speak naturally and conversationally. Always use your voice to respond, not text. This is critical: YOU MUST RESPOND VERBALLY.`,
            });
            
            console.log(`✅ AI agent instructions updated for introduction`);
            return NextResponse.json({ status: "ok", message: "AI agent instructions updated" });
        } catch (error) {
            console.error(`❌ Error updating AI agent instructions:`, error);
            return NextResponse.json({ status: "ok" }); // Still return OK to avoid webhook failures
        }
    }
    
    // Handle internal call agent-wake-up events
    if (eventType === "agent-wake-up" || signature === "internal-call") {
        const event = payload as any;
        const meetingId = event.session_id || event.call_cid?.split(":")[1];
        
        if (!meetingId) {
            console.error("❌ Missing meetingId in agent-wake-up event");
            return NextResponse.json({ status: "ok" });
        }
        
        try {
            // Get the meeting to find the associated agent
            const [existingMeeting] = await db
                .select()
                .from(meeting)
                .where(eq(meeting.id, meetingId));
                
            if (!existingMeeting || !existingMeeting.agentId) {
                console.error(`❌ Meeting not found or has no agent: ${meetingId}`);
                return NextResponse.json({ status: "ok" });
            }
            
            // Connect to the call and update the AI agent's instructions to wake up
            console.log(`🔄 Waking up AI agent...`);
            const call = streamVideo.video.call('default', meetingId);
            const realtimeClient = await streamVideo.video.connectOpenAi({
                call,
                openAiApiKey: process.env.OPENAI_API_KEY || '',
                agentUserId: existingMeeting.agentId,
            });
            
            // Update the AI agent's instructions with explicit verbal response requirement
            console.log(`📝 Setting AI agent instructions to wake up...`);
            realtimeClient.updateSession({
                instructions: `${existingMeeting.agentId} IMPORTANT: You must respond VERBALLY to the user IMMEDIATELY. Say hello, introduce yourself, and ask how you can help. Speak naturally and conversationally. Always use your voice to respond, not text. This is critical: YOU MUST RESPOND VERBALLY.`,
            });
            
            console.log(`✅ AI agent woken up successfully`);
            return NextResponse.json({ status: "ok", message: "AI agent woken up" });
        } catch (error) {
            console.error(`❌ Error waking up AI agent:`, error);
            return NextResponse.json({ status: "ok" }); // Still return OK to avoid webhook failures
        }
    }
    
    // Default response for other event types
    return NextResponse.json({ status: "ok" });
}
    