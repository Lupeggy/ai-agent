import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import jwt from 'jsonwebtoken';
import { StreamClient } from "@stream-io/node-sdk";

import { db } from "@/db";
import { agent, meeting } from "@/db/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { meetingInsertSchema, meetingUpdateSchema } from "../schemas";

// Extended schema with additional fields for updates
const extendedMeetingUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { message: "Name is required" }).optional(),
  agentId: z.string().min(1, { message: "Agent is required" }).optional(),
  status: z.enum(['upcoming', 'active', 'completed', 'processing', 'cancelled']).optional(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional()
});

// Define a default page size if not imported from constants
const DEFAULT_PAGE_SIZE = 10;

// Helper function to generate avatar URI
const generateAvatarUri = ({ seed, variant }: { seed: string, variant: string }) => {
  return `https://api.dicebear.com/7.x/${variant}/svg?seed=${encodeURIComponent(seed)}`;
};

// Stream API credentials
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_VIDEO_SECRET_KEY;

// Ensure Stream credentials are provided, otherwise throw an error.
if (!STREAM_API_KEY || !STREAM_API_SECRET) {
  throw new Error("Stream API key and secret must be provided in environment variables.");
}

// Initialize Stream Video client for server-side usage
const createStreamClient = () => {
  return new StreamClient(
    STREAM_API_KEY!,
    STREAM_API_SECRET!
  );
};

// Helper function to handle Stream Video operations
const handleStreamCall = async (callId: string, operation: 'create' | 'end', meetingName?: string) => {
  try {
    console.log(`Handling Stream call for meeting ${callId}, operation: ${operation}`);
    
    // Create a client using the server-side SDK
    const client = createStreamClient();
    
    console.log('Stream client connected successfully');
    
    // Get the call object
    const call = client.video.call('default', callId);
    
    try {
      if (operation === 'create') {
        console.log(`Creating call for meeting ${callId}`);
        
        // First try to get the call to see if it exists
        try {
          await call.get();
          console.log(`Call ${callId} already exists, updating it`);
        } catch (getError) {
          console.log(`Call ${callId} does not exist yet, will create it`);
        }
        
        // Create or get the call with proper data
        await call.getOrCreate({
          data: {
            created_by_id: 'server-admin', // Required when using server-side auth
            custom: {
              meetingId: callId,
              meetingName: meetingName || callId,
              createdAt: new Date().toISOString(),
              serverManaged: true
            }
          }
        });
        
        console.log(`Stream call created for meeting ${callId}`);
      } else if (operation === 'end') {
        // End the call
        console.log(`Attempting to end call for meeting ${callId}`);
        try {
          await call.end();
          console.log(`Stream call ended for meeting ${callId}`);
        } catch (endError: any) {
          // If the call doesn't exist or is already ended, just log it
          console.log(`Error ending call (may not exist): ${endError?.message || endError}`);
        }
      }
    } catch (error: any) {
      console.error(`Error with Stream call operation ${operation}: ${error?.message || error}`);
    }
    
    // No need to disconnect with the server-side SDK
    console.log('Stream operation completed');
  } catch (error: any) {
    console.error(`Stream API error: ${error?.message || error}`);
  }
};

export const meetingsRouter = createTRPCRouter({
  generateToken: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        meetingId: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('Generating token for:', { userId: input.userId || ctx.auth.user.id, meetingId: input.meetingId });
        
        // Generate a Stream compatible token
        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago (for clock skew)
        
        // Use the explicitly provided userId if available, otherwise fall back to the authenticated user
        const userId = input.userId || ctx.auth.user.id;
        const userName = ctx.auth.user.name || ctx.auth.user.email || "User";
        const userImage = ctx.auth.user.image || 
          generateAvatarUri({ seed: userName, variant: "initials" });
        
        // Create the payload for Stream Video token
        const payload = {
          user_id: userId,
          user_name: userName,
          user_image: userImage,
          exp: expirationTime,
          iat: issuedAt,
          // Add call specific permissions
          call: {
            id: input.meetingId,
            type: 'default',
            // Grant all permissions for the call
            role: 'admin',
          }
        };
        
        console.log('Token payload:', JSON.stringify(payload, null, 2));
        
        // Sign with the Stream API Secret
        const token = jwt.sign(payload, STREAM_API_SECRET!);
        
        console.log('Generated token successfully for:', userId);
        
        return {
          token,  // This is the raw JWT token string that Stream Video client needs
          userId,
          expiresAt: new Date(expirationTime * 1000)
        };
      } catch (error) {
        console.error("Error generating Stream token:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate video call token"
        });
      }
    }),
  
  create: protectedProcedure
    .input(meetingInsertSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { name, agentId } = input;

        // Verify the agent exists and belongs to the user
        const [existingAgent] = await db
          .select()
          .from(agent)
          .where(and(eq(agent.id, agentId), eq(agent.userId, ctx.auth.user.id)));

        if (!existingAgent) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
        }

        // Create the meeting
        const [newMeeting] = await db
          .insert(meeting)
          .values({
            name,
            agentId,
            userId: ctx.auth.user.id,
          })
          .returning();
          
        // Create the Stream Video call in the background
        // We don't await this to keep the response fast
        handleStreamCall(newMeeting.id, 'create', name)
          .catch(err => console.error(`Error creating Stream call for new meeting ${newMeeting.id}:`, err));

        return newMeeting;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create meeting: ${error.message}`
        });
      }
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select()
        .from(meeting)
        .where(and(eq(meeting.id, input.id), eq(meeting.userId, ctx.auth.user.id)));

      if (!existingMeeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" });
      }

      return existingMeeting;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        search: z.string().optional().default(""),
        pageSize: z.number().min(1).optional().default(DEFAULT_PAGE_SIZE),
        agentId: z.string().nullish().optional(),
        status: z.enum(["upcoming", "active", "completed", "processing", "cancelled"]).nullish()
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, search, agentId, status, pageSize } = input;
      const limit = pageSize || DEFAULT_PAGE_SIZE;
      const offset = (page - 1) * limit;

      const where = and(
        eq(meeting.userId, ctx.auth.user.id),
        search ? ilike(meeting.name, `%${search}%`) : undefined,
        agentId ? eq(meeting.agentId, agentId) : undefined,
        status ? eq(meeting.status, status) : undefined,
      );

      const meetingPromise = db
        .select()
        .from(meeting)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(meeting.createdAt));

      const totalPromise = db
        .select({ count: sql<number>`count(*)` })
        .from(meeting)
        .where(where);

      const [data, [total]] = await Promise.all([
        meetingPromise,
        totalPromise,
      ]);

      return {
        data,
        totalPages: Math.ceil(total.count / limit),
      };
    }),
    
  update: protectedProcedure
    .input(extendedMeetingUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, name, agentId, status, startedAt, endedAt } = input;

        // Verify the meeting exists and belongs to the user
        const [existingMeeting] = await db
          .select()
          .from(meeting)
          .where(and(eq(meeting.id, id), eq(meeting.userId, ctx.auth.user.id)));

        if (!existingMeeting) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" });
        }
        
        // Sync with Stream Video if status is changing
        if (status && status !== existingMeeting.status) {
          // If meeting is becoming active, ensure call exists in Stream
          if (status === 'active') {
            // Don't await this - let it run in the background
            handleStreamCall(id, 'create', name || existingMeeting.name)
              .catch(err => console.error('Background Stream call creation error:', err));
          }
          
          // If meeting is completed, end the call in Stream
          if (status === 'completed') {
            // Don't await this - let it run in the background
            handleStreamCall(id, 'end')
              .catch(err => console.error('Background Stream call ending error:', err));
          }
        }

        // Verify the agent exists and belongs to the user if changing agent
        if (agentId) {
          const [existingAgent] = await db
            .select({ id: agent.id })
            .from(agent)
            .where(and(eq(agent.id, agentId), eq(agent.userId, ctx.auth.user.id)));

          if (!existingAgent) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
          }
        }

        // Create update data object with only defined values
        const updateData: Record<string, any> = {
          updatedAt: new Date()
        };
        
        if (name) updateData.name = name;
        if (agentId) updateData.agentId = agentId;
        if (status) updateData.status = status;
        
        // Ensure dates are properly handled
        if (startedAt) {
          // Convert string dates to Date objects
          updateData.startedAt = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
        }
        
        if (endedAt) {
          // Convert string dates to Date objects
          updateData.endedAt = typeof endedAt === 'string' ? new Date(endedAt) : endedAt;
        }

        // Update the meeting
        const [updatedMeeting] = await db
          .update(meeting)
          .set(updateData)
          .where(and(eq(meeting.id, id), eq(meeting.userId, ctx.auth.user.id)))
          .returning();

        return updatedMeeting;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update meeting: ${error.message}`
        });
      }
    }),
  
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id } = input;

        // Verify the meeting exists and belongs to the user
        const [existingMeeting] = await db
          .select()
          .from(meeting)
          .where(and(eq(meeting.id, id), eq(meeting.userId, ctx.auth.user.id)));

        if (!existingMeeting) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" });
        }

        // End any active Stream Video call in the background
        // We don't await this to keep the response fast
        handleStreamCall(id, 'end')
          .catch(err => console.error(`Error ending Stream call for deleted meeting ${id}:`, err));

        // Delete the meeting
        await db
          .delete(meeting)
          .where(and(eq(meeting.id, id), eq(meeting.userId, ctx.auth.user.id)));

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remove meeting: ${error.message}`
        });
      }
    }),
});

