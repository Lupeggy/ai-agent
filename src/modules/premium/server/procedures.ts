import { eq, count } from "drizzle-orm"

import { db } from "@/db";
import { agent, meeting } from "@/db/schemas"
import { polarClient } from "@/lib/polar";
import {
    createTRPCRouter,
    protectedProcedure,
} from "@/trpc/init";

export const premiumRouter = createTRPCRouter ({
    getFreeUsage: protectedProcedure.query(async ({ ctx }) => {
        // Get customer data from Polar
        const customer = await polarClient.customers.getStateExternal({
            externalId: ctx.auth.user.id,
        });
        
        const subscription = customer.activeSubscriptions[0];
        
        // Always get meeting and agent counts
        const [ userMeetings ] = await db
        .select({
            count: count(meeting.id),
        })
        .from(meeting)
        .where(eq(meeting.userId, ctx.auth.user.id));

        const [ userAgents ] = await db
        .select({
            count: count(agent.id),
        })
        .from(agent)
        .where(eq(agent.userId, ctx.auth.user.id));

        // Always return the counts, even if no subscription
        return {
            subscription: subscription || null,
            meetings: userMeetings.count,
            agents: userAgents.count
        };

    })
});