import { db } from "@/db";
import { agent } from "@/db/schemas";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";
import { agentInsertSchema } from "../schemas";
import { z } from "zod";
import { eq } from "drizzle-orm";
// import { TRPCError } from "@trpc/server";

export const agentsRouter = createTRPCRouter({

  getOne: baseProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const [existingAgent] = await db
      .select()
      .from(agent)
      .where(eq(agent.id, input.id))

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return existingAgent;
  }),

  getMany: baseProcedure.query(async () => {
    const data = await db
      .select()
      .from(agent);

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return data;
  }),

  create: protectedProcedure
    .input(agentInsertSchema)
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
});
