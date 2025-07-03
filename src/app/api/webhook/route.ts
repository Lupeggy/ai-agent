import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agent, meeting } from "@/db/schemas";
import { streamVideo } from "@/lib/stream-video-server";
import { inngest } from "@/inngest/client";

// Define types for webhook events since they may not match the SDK types exactly
type CallSessionStartedEvent = {
  call: {
    id: string;
    cid?: string;
    custom?: {
      meetingId?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
};

type CallSessionParticipantLeftEvent = {
  call: {
    id: string;
    cid?: string;
    custom?: {
      meetingId?: string;
      [key: string]: any;
    };
  };
  participant?: {
    user_id?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

type CallEndedEvent = {
  call: {
    id: string;
    cid?: string;
    custom?: {
      meetingId?: string;
      [key: string]: any;
    };
  };
  [key: string]: any;
};

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
    
    // Log the full payload for debugging recording and transcription events
    if (eventType === "call.recording_ready" || eventType === "call.transcription_ready") {
        console.log(`📝 FULL WEBHOOK PAYLOAD for ${eventType}:`, JSON.stringify(payload, null, 2));
    }

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
                    status: "processing",
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
                    status: "processing",
                    endedAt: new Date(),
                })
                .where(eq(meeting.id, meetingId));
        }
    }

    // Handle transcription events to ensure AI agent responds verbally
    if (eventType === "call.transcription_ready") {
        // Use any type since the SDK types don't match the actual webhook payload
        const event = payload as any;
        
        // Log the full event structure for debugging
        console.log(`📝 Full transcription event:`, JSON.stringify(event, null, 2));
        
        // For verbal responses, we need these fields
        const meetingId = event.session_id;
        const text = event.transcription?.text;
        const userId = event.transcription?.user?.id;
        
        // For transcript URL storage, we'll handle separately
        // First handle the verbal response part if applicable
        if (meetingId && text && userId) {
            console.log(`📝 Transcription received from user ${userId}: ${text}`);
        } else {
            console.log("❌ Missing data for verbal response in transcription event");
            // Don't return yet, we still want to try to save the transcript URL if available
        }
        
        // Handle transcript URL separately from verbal response
        // Check for both possible structures in the payload
        const transcriptUrl = event.call_transcription?.url || event.transcript_url;
        
        if (transcriptUrl) {
            console.log(`📝 Found transcript URL: ${transcriptUrl}`);
            
            try {
                // Try multiple ways to extract the meeting ID
                let callId;
                
                if (event.call_cid) {
                    // Format: "default:meeting-id"
                    callId = event.call_cid.split(":")[1];
                    console.log(`📝 Extracted meeting ID from call_cid: ${callId}`);
                } else if (event.call?.id) {
                    callId = event.call.id;
                    console.log(`📝 Extracted meeting ID from call.id: ${callId}`);
                } else if (event.call?.custom?.meetingId) {
                    callId = event.call.custom.meetingId;
                    console.log(`📝 Extracted meeting ID from call.custom.meetingId: ${callId}`);
                } else if (event.session_id) {
                    callId = event.session_id;
                    console.log(`📝 Using session_id as meeting ID: ${callId}`);
                }
                
                console.log(`📝 Updating meeting ${callId} with transcript URL: ${transcriptUrl}`);
                
                if (!callId) {
                    console.error(`❌ Unable to extract meeting ID from transcription event`);
                    console.error("Event data:", JSON.stringify(event, null, 2));
                    return NextResponse.json({ error: "Missing meeting ID" }, { status: 400 });
                }
                
                // Verify the meeting exists before updating
                const [existingMeeting] = await db
                    .select()
                    .from(meeting)
                    .where(eq(meeting.id, callId));
                    
                if (!existingMeeting) {
                    console.error(`❌ Meeting with ID ${callId} not found for transcript update`);
                    
                    // Try to find by matching on other fields as a fallback
                    const allMeetings = await db
                        .select()
                        .from(meeting)
                        .where(not(eq(meeting.status, "cancelled")));
                        
                    console.log(`📝 Available meetings:`, allMeetings.map(m => ({ id: m.id, status: m.status })));
                    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
                }
                
                console.log(`📝 Found meeting to update:`, existingMeeting);
                
                const [updatedMeeting] = await db
                    .update(meeting)
                    .set({
                        transcript: transcriptUrl,
                        updatedAt: new Date()
                    })
                    .where(eq(meeting.id, callId))
                    .returning();
                
                console.log(`✅ Updated meeting with transcript URL:`, updatedMeeting);
                
                if (!updatedMeeting) {
                    console.error(`❌ Failed to update meeting ${callId} with transcript URL`);
                } else {
                    // Trigger Inngest function for transcript processing
                    try {
                        console.log(`📣 Triggering transcript processing for meeting ${updatedMeeting.id}`);
                        await inngest.send({
                            name: "meetings.processing",
                            data: {
                                meetingId: updatedMeeting.id,
                                transcriptUrl: transcriptUrl
                            }
                        });
                        console.log(`✅ Successfully triggered transcript processing`);
                    } catch (inngestError) {
                        console.error(`❌ Error triggering transcript processing:`, inngestError);
                    }
                }
            } catch (error) {
                console.error("❌ Error updating meeting with transcript URL:", error);
            }
        }
        
        // Only try to update agent instructions if we have the necessary data for a verbal response
        if (meetingId && text && userId) {
            try {
                // Get the meeting to find the associated agent
                const [existingMeeting] = await db
                    .select()
                    .from(meeting)
                    .where(eq(meeting.id, meetingId));
                    
                if (!existingMeeting || !existingMeeting.agentId) {
                    console.log(`❌ Meeting not found or has no agent for verbal response: ${meetingId}`);
                    // Don't return yet, we might still need to process transcript URL
                } else {
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
                }
            } catch (error) {
                console.error(`❌ Error updating AI agent instructions:`, error);
                // Continue processing - don't return yet
            }
        }
        
        // Always return a success response at the end of the transcription handler
        return NextResponse.json({ status: "ok" });
    }
    
    // Handle recording ready events
    if (eventType === "call.recording_ready") {
        // Use any type since the SDK types don't match the actual webhook payload
        const event = payload as any;
        
        try {
            // Try multiple ways to extract the meeting ID
            let callId;
            
            if (event.call_cid) {
                // Format: "default:meeting-id"
                callId = event.call_cid.split(":")[1];
                console.log(`🎥 Extracted meeting ID from call_cid: ${callId}`);
            } else if (event.call?.id) {
                callId = event.call.id;
                console.log(`🎥 Extracted meeting ID from call.id: ${callId}`);
            } else if (event.call?.custom?.meetingId) {
                callId = event.call.custom.meetingId;
                console.log(`🎥 Extracted meeting ID from call.custom.meetingId: ${callId}`);
            } else if (event.session_id) {
                callId = event.session_id;
                console.log(`🎥 Using session_id as meeting ID: ${callId}`);
            }
            
            if (!callId) {
                console.error("❌ Missing callId in recording_ready event");
                console.error("Event data:", JSON.stringify(event, null, 2));
                return NextResponse.json({ error: "Missing callId" }, { status: 404 });
            }
            
            // Ensure recording URL exists - check the correct path in the payload
            if (!event.call_recording?.url) {
                console.error("❌ Missing recording URL in recording_ready event");
                return NextResponse.json({ error: "Missing recording URL" }, { status: 400 });
            }
            
            console.log(`🎥 Recording ready for meeting ${callId}: ${event.call_recording.url}`);
            
            if (!callId) {
                console.error(`❌ Unable to extract meeting ID from recording event`);
                console.error("Event data:", JSON.stringify(event, null, 2));
                return NextResponse.json({ error: "Missing meeting ID" }, { status: 400 });
            }
            
            // Verify the meeting exists before updating
            const [existingMeeting] = await db
                .select()
                .from(meeting)
                .where(eq(meeting.id, callId));
                
            if (!existingMeeting) {
                console.error(`❌ Meeting with ID ${callId} not found for recording update`);
                
                // Try to find by matching on other fields as a fallback
                const allMeetings = await db
                    .select()
                    .from(meeting)
                    .where(not(eq(meeting.status, "cancelled")));
                    
                console.log(`🎥 Available meetings:`, allMeetings.map(m => ({ id: m.id, status: m.status })));
                return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
            }
            
            console.log(`🎥 Found meeting to update:`, existingMeeting);
            
            const [updatedMeeting] = await db
                .update(meeting)
                .set({ 
                    recordingUrl: event.call_recording.url,
                    updatedAt: new Date()
                })
                .where(eq(meeting.id, callId))
                .returning();
            
            if (!updatedMeeting) {
                console.error(`❌ Failed to update meeting ${callId} with recording URL`);
                return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
            }
            
            console.log(`✅ Updated meeting with recording URL:`, updatedMeeting);
            
            console.log(`✅ Updated meeting ${callId} with recording URL`);
            return NextResponse.json({ status: "ok", message: "Recording URL saved" });
        } catch (error) {
            console.error("❌ Error updating meeting with recording URL:", error);
            return NextResponse.json({ status: "error", message: "Failed to save recording URL" });
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
    