import { db } from "@/db";
import { agent } from "@/db/schemas";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";

export const agentsRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const data = await db
      .select()
      .from(agent);

    return data;
  })
});
