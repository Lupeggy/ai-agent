import { inArray, eq } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { db } from "@/db";
import { agent, meeting, user } from "@/db/schemas";

const summarizer = createAgent({
  name: "summarizer",
  system: `
    You are an expert meeting summarizer. Your job is to produce clear, structured summaries of meeting transcripts.
    The transcript will be provided as a conversation between speakers.
    
    Instructions:
    1. Read the entire transcript carefully
    2. Identify key topics, decisions, action items, and important exchanges
    3. Structure your summary using the following markdown format:
    
    ### Meeting Overview
    [Provide a concise paragraph summarizing what the meeting was about]
    
    ### Key Points
    - [Important point 1]
    - [Important point 2]
    - [Continue with other key points...]
    
    ### Action Items
    - [Action item 1]
    - [Action item 2]
    - [Continue with other action items if any...]
    
    ### Discussion Highlights
    #### [Topic 1]
    [Summarize discussion about this topic]
    
    #### [Topic 2]
    [Summarize discussion about this topic]
    
    Always focus on capturing the essential information. If the transcript is short or doesn't contain action items, adjust the format accordingly.
  `.trim(),
  model: openai({ model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY  })
});

export const meetingProcessing = inngest.createFunction(
  { id: "process-meeting-transcript", name: "Process meeting transcript" },
  [{ event: "meetings.processing" }],
  async ({ event, step }: { event: any; step: any }) => {
    // Define summaryText in the outer scope so it's available to all steps
    let summaryText = "";

    try {
      console.log(`Processing meeting: ${event.data.meetingId} with transcript URL: ${event.data.transcriptUrl}`);
      
      // First, check if this meeting is already processed or being processed
      const meetingData = await step.run("check-meeting-status", async () => {
        return await db
          .select()
          .from(meeting)
          .where(eq(meeting.id, event.data.meetingId))
          .then(rows => rows[0]);
      });
      
      // If the meeting is already completed or already has a summary, don't process again
      if (meetingData?.status === "completed" && meetingData?.summary) {
        console.log(`Meeting ${event.data.meetingId} is already processed with status: ${meetingData.status}`);
        return {
          success: true,
          meetingId: event.data.meetingId,
          skipped: true,
          reason: "Meeting is already processed"
        };
      }
      
      // Update status to processing if not already
      if (meetingData?.status !== "processing") {
        await step.run("update-to-processing", async () => {
          await db
            .update(meeting)
            .set({
              status: "processing",
              updatedAt: new Date()
            })
            .where(eq(meeting.id, event.data.meetingId));
        });
      }
      
      // Fetch transcript content
      const response = await step.run("fetch-transcript", async () => {
        const res = await fetch(event.data.transcriptUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch transcript: ${res.status}`);
        }
        return res;
      });

      const transcriptText = await response.text();

      // Parse the JSONL transcript
      const transcript = await step.run("parse-transcript", async () => {
        return JSONL.parse<StreamTranscriptItem>(transcriptText);
      });

      // Add speaker information
      const transcriptWithSpeakers = await step.run("add-speakers", async () => {
        // Log transcript data for debugging
        console.log(`Transcript contains ${transcript.length} total items`);

        // Filter out invalid transcript items first
        const validTranscript = transcript.filter((item: StreamTranscriptItem) => {
          const isValid = item && item.user_id && item.text && item.created_at;
          if (!isValid) {
            console.warn("Invalid transcript item:", JSON.stringify(item));
          }
          return isValid;
        });

        console.log(`Found ${validTranscript.length} valid transcript items`);

        if (validTranscript.length === 0) {
          console.warn("No valid transcript items found");
          // Return empty array to prevent errors in subsequent steps
          return [];
        }

        // Get unique speaker IDs from transcript
        const speakerIds = [
          ...new Set(validTranscript.map((item: StreamTranscriptItem) => item.user_id)),
        ] as string[];

        // Get user speakers
        const userSpeakers = await db
          .select()
          .from(user)
          .where(inArray(user.id, speakerIds as string[]))
          .then((users) =>
            users.map((user) => ({
              id: user.id,
              name: user.name,
              type: "user",
            }))
          );

        // Get agent speakers
        const agentSpeakers = await db
          .select()
          .from(agent)
          .where(inArray(agent.id, speakerIds as string[]))
          .then((agents) =>
            agents.map((agent) => ({
              id: agent.id,
              name: agent.name,
              type: "agent",
            }))
          );

        // Combine all speakers
        const speakers = [...userSpeakers, ...agentSpeakers];

        // Add speaker info to transcript items
        // Map only valid transcript items with speaker information
        return validTranscript.map((item: StreamTranscriptItem) => {
          // Look for speaker by user_id
          const speaker = speakers.find((s) => s.id === item.user_id);

          if (!speaker) {
            // Improved speaker identification logic
            const isAgent =
              item.user_id.startsWith("agent-") ||
              item.user_id.includes("agent") ||
              item.user_id.includes("bot") ||
              item.user_id.includes("ai");

            // Log unidentified speakers for debugging
            console.log(
              `Unidentified speaker with ID: ${item.user_id}, classified as: ${isAgent ? "agent" : "user"}`
            );

            return {
              id: item.id || `${item.user_id}-${item.created_at}`,
              text: item.text,
              created_at: item.created_at,
              user_id: item.user_id,
              user: {
                name: isAgent ? "AI Assistant" : "User", // Changed "Unknown" to "User" for better clarity
                type: isAgent ? "agent" : "user",
              },
            };
          }

          return {
            id: item.id || `${item.user_id}-${item.created_at}`,
            text: item.text,
            created_at: item.created_at,
            user_id: item.user_id,
            user: {
              name: speaker.name,
              type: speaker.type,
            },
          };
        });
      });

      // Check if we have valid transcript data for summarization
      if (!transcriptWithSpeakers || transcriptWithSpeakers.length === 0) {
        console.error(`No valid transcript data found for meeting: ${event.data.meetingId}`);
        throw new Error("No valid transcript data to summarize");
      }

      // Format transcript for better summarization
      const formattedTranscript = transcriptWithSpeakers.map((item: any) => {
        const speaker = item.user?.name || (item.user?.type === "agent" ? "AI Assistant" : "User");
        return `${speaker}: ${item.text}`;
      }).join("\n\n");

      // Generate summary using the agent with improved prompt
      console.log(`Generating summary for meeting: ${event.data.meetingId} with ${transcriptWithSpeakers.length} transcript items`);
      
      // Create the prompt with the actual transcript
      const prompt = `Please summarize the following meeting transcript in a structured format:

${formattedTranscript}`;
      
      console.log(`Sending transcript to summarizer, ${formattedTranscript.length} characters`);
      
      // Generate the summary
      const result = await step.run("generate-summary", async () => {
        const { output } = await summarizer.run(prompt);
        
        // Verify we have valid output
        if (!output || output.length === 0 || !output[0]) {
          console.error(`Invalid output from summarizer for meeting: ${event.data.meetingId}`);
          throw new Error('Invalid summarizer output');
        }
        
        // Get summary text from output
        const generatedText = (output[0] as TextMessage).content as string;
        
        // Log summary generation results
        console.log(`Summary generated successfully for meeting: ${event.data.meetingId}`);
        console.log(`Summary preview: ${generatedText.substring(0, 100)}...`);
        console.log(`Summary length: ${generatedText.length} characters`);

        // Verify that we have a valid summary to save
        if (!generatedText || generatedText.trim() === '') {
          console.error(`Generated summary is empty for meeting: ${event.data.meetingId}`);
          throw new Error('Generated summary is empty');
        }
        
        return generatedText;
      });
      
      summaryText = result;
      
      // Save summary to database
      await step.run("save-summary", async () => {
        console.log(`Saving summary to database for meeting: ${event.data.meetingId}`);
        console.log(`Summary length: ${summaryText.length} characters`);
        
        // Try to update the meeting with the summary
        try {
          const result = await db
            .update(meeting)
            .set({
              summary: summaryText,
              status: "completed",
              updatedAt: new Date() // Add updatedAt to ensure the UI refreshes
            })
            .where(eq(meeting.id, event.data.meetingId));
          
          console.log(`Summary saved successfully for meeting: ${event.data.meetingId}`);
          
          // Verify the update worked
          const updatedMeeting = await db
            .select()
            .from(meeting)
            .where(eq(meeting.id, event.data.meetingId))
            .then(rows => rows[0]);
          
          console.log(`Meeting after update:`, {
            id: updatedMeeting.id,
            status: updatedMeeting.status,
            hasSummary: !!updatedMeeting.summary,
            summaryLength: updatedMeeting.summary ? updatedMeeting.summary.length : 0,
            updatedAt: updatedMeeting.updatedAt
          });
        } catch (dbError) {
          console.error(`Failed to update meeting with summary: ${dbError}`);
          throw dbError; // Rethrow to trigger step failure
        }
      });
      
      return {
        success: true,
        meetingId: event.data.meetingId,
        summaryLength: summaryText.length
      };
    } catch (error: unknown) {
      console.error("Error processing transcript:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update meeting status to completed and save the error message in the summary
      try {
        await step.run("update-meeting-with-error", async () => {
          await db
            .update(meeting)
            .set({
              status: "completed",
              summary: `Failed to generate summary: ${errorMessage}`,
              updatedAt: new Date()
            })
            .where(eq(meeting.id, event.data.meetingId));
        });
        console.log(`Meeting ${event.data.meetingId} marked as completed with error message after processing failure.`);
      } catch (updateError) {
        console.error("Failed to update meeting status after error:", updateError);
      }
      
      return { error: `Failed to process transcript: ${errorMessage}` };
    }
  }
);