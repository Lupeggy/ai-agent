import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import { count, eq } from 'drizzle-orm';
import { agent, meeting } from '@/db/schemas';
import { MAX_FREE_AGENTS, MAX_FREE_MEETINGS } from '@/modules/premium/constants';
import { polarClient } from '@/lib/polar';

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ctx, next}) => {
  const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    return next({
      ctx: {
        ...ctx,
        auth: session,
      },
    });
});

export const premiumProcedure = (entity: "meetings" | "agents") =>
  protectedProcedure.use(async ({ ctx, next }) => {
    try {
      const customer = await polarClient.customers.getStateExternal({
        externalId: ctx.auth.user.id,
      });

      const [userMeetings] = await db
        .select({ count: count() })
        .from(meeting)
        .where(eq(meeting.userId, ctx.auth.user.id));
      
      const [userAgents] = await db
        .select({ count: count() })
        .from(agent)
        .where(eq(agent.userId, ctx.auth.user.id));

      const isPremium = customer?.activeSubscriptions?.length > 0;
      const isFreeAgentLimitReached = userAgents.count >= MAX_FREE_AGENTS;
      const isFreeMeetingLimitReached = userMeetings.count >= MAX_FREE_MEETINGS;

      const shouldThrowMeetingError =
        entity === "meetings" && isFreeMeetingLimitReached && !isPremium;
      const shouldThrowAgentError =
        entity === "agents" && isFreeAgentLimitReached && !isPremium;

      if (shouldThrowMeetingError) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Meeting limit reached" });
      }
      
      if (shouldThrowAgentError) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Agent limit reached" });
      }

      return next({
        ctx: { ...ctx, customer }
      });
    } catch (error) {
      console.error("Premium procedure error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to check premium status" });
    }
  });