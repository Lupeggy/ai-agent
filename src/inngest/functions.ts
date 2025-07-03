import { inArray, eq } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { db } from "@/db";
import { agent, meeting, user } from "@/db/schemas";

const summarizer = createAgent({
  
  name: "summarizer",
  system:
        `You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.
      Instructions:
      Use the following markdown structure for every output:
      ### Overview
      Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, us[ing]
      ### Notes
      Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.
        #### Section Name
        - Main point or demo shown here
        - Another key insight or interaction
        - Follow-up tool or explanation provided
        
        #### Next Section
        - Feature X automatically does Y
        - Mention of integration with Z`

        .trim(),
        model: openai({ model:"gpt-4o", apiKey: process.env.OPENAI_API_KEY})
});

export const meetingProcessing = inngest.createFunction(
    { id: "meeting-processing" },
    { event: "meetings.processing" },
    async ({ event, step }) => {
        try {
            // Fetch transcript content
            const response = await fetch(event.data.transcriptUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch transcript: ${response.status}`);
            }
            
            const transcriptText = await response.text();
            
            // Parse the JSONL transcript
            const transcript = await step.run("parse-transcript", async () => {
                return JSONL.parse<StreamTranscriptItem>(transcriptText);
            });
            
            // Add speaker information
            const transcriptWithSpeakers = await step.run("add-speakers", async () => {
                // Get unique speaker IDs from transcript
                const speakerIds = [
                    ...new Set(transcript.map((item) => item.speaker_id)),
                ];
                
                // Get user speakers
                const userSpeakers = await db
                    .select()
                    .from(user)
                    .where(inArray(user.id, speakerIds))
                    .then((users) =>
                        users.map((user) => ({
                            id: user.id,
                            name: user.name,
                            type: "user"
                        }))
                    );
                
                // Get agent speakers
                const agentSpeakers = await db
                    .select()
                    .from(agent)
                    .where(inArray(agent.id, speakerIds))
                    .then((agents) =>
                        agents.map((agent) => ({
                            id: agent.id,
                            name: agent.name,
                            type: "agent"
                        }))
                    );
                
                // Combine all speakers
                const speakers = [...userSpeakers, ...agentSpeakers];
                
                // Add speaker info to transcript items
                return transcript.map((item) => {
                    const speaker = speakers.find((s) => s.id === item.speaker_id);
                    
                    if (!speaker) {
                        return {
                            ...item,
                            user: {
                                name: "Unknown"
                            }
                        };
                    }
                    
                    return {
                        ...item,
                        user: {
                            name: speaker.name
                        }
                    };
                });
            });

            // Generate summary using the agent
            const { output } = await summarizer.run(
                "Summarize the following transcript: "
                + JSON.stringify(transcriptWithSpeakers)
            );

            // Save summary to database
            await step.run("save-summary", async () => {
                await db
                    .update(meeting)
                    .set({
                        summary: (output[0] as TextMessage).content as string,
                        status: "completed",
                    })
                    .where(eq(meeting.id, event.data.meetingId));
            });
            
            return {
                success: true,
                meetingId: event.data.meetingId,
                summaryLength: ((output[0] as TextMessage).content as string).length
            };
        } catch (error: unknown) {
            console.error("Error processing transcript:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { error: `Failed to process transcript: ${errorMessage}` };
        }
    }
);