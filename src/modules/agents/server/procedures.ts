import { db } from "@/db";
import { agent, meeting } from "@/db/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agentInsertSchema, agentUpdateSchema } from "../schemas";
import { DEFAULT_PAGE_SIZE } from "../constants";
import { z } from "zod";
import { and, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const agentsRouter = createTRPCRouter({

  getOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const [existingAgent] = await db
      .select({
        id: agent.id,
        name: agent.name,
        userId: agent.userId,
        instructions: agent.instructions,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        meetingCount: sql<number>`count(${meeting.id})`.as("meetingCount"),
      })
      .from(agent)
      .leftJoin(meeting, eq(agent.id, meeting.agentId))
      .where(
        and(
          eq(agent.id, input.id),
          eq(agent.userId, ctx.auth.user.id)
        )
      )
      .groupBy(agent.id);

    if (!existingAgent) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
    }

    return existingAgent;
  }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = input ?? {};

      const whereClauses = [eq(agent.userId, ctx.auth.user.id)];
      if (search) {
        whereClauses.push(ilike(agent.name, `%${search}%`));
      }

      const data = await db
        .select()
        .from(agent)
        .where(and(...whereClauses))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(agent)
        .where(and(...whereClauses));

      return {
        data,
        totalPages: Math.ceil(count / pageSize),
      };
    }),

  create: protectedProcedure.input(agentInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createAgent] = await db
        .insert(agent)
        .values({
          ...input,
          userId: ctx.auth.user.id
        })
        .returning();

      return createAgent;
    }),

  update: protectedProcedure.input(agentUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedAgent] = await db
        .update(agent)
        .set(input)
        .where(and(eq(agent.id, input.id), eq(agent.userId, ctx.auth.user.id)))
        .returning();

      return updatedAgent;
    }),

  remove: protectedProcedure.input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedAgent] = await db
        .delete(agent)
        .where(and(eq(agent.id, input.id), eq(agent.userId, ctx.auth.user.id)))
        .returning();

      return removedAgent;
    }),
});
