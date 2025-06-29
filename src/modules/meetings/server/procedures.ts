import { db } from "@/db";
import { agent, meeting } from "@/db/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { meetingInsertSchema } from "../schemas";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const DEFAULT_PAGE_SIZE = 10;

export const meetingsRouter = createTRPCRouter({
  create: protectedProcedure.input(meetingInsertSchema).mutation(async ({ input, ctx }) => {
    const { name, agentId } = input;


    // Verify the agent exists and belongs to the user
    const [existingAgent] = await db
      .select({ id: agent.id })
      .from(agent)
      .where(and(eq(agent.id, agentId), eq(agent.userId, ctx.auth.user.id)));

    if (!existingAgent) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
    }

    const [newMeeting] = await db
      .insert(meeting)
      .values({
        name,
        agentId,
        userId: ctx.auth.user.id
      })
      .returning();

    return newMeeting;
  }),

  getOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
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

      const meetingsPromise = db
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
        meetingsPromise,
        totalPromise,
      ]);

      return {
        data,
        totalPages: Math.ceil(total.count / limit),
      };
    }),
});
