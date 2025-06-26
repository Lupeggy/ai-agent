import { db } from "@/db";
import { agent } from "@/db/schemas";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
// import { TRPCError } from "@trpc/server";

export const agentsRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const data = await db
      .select()
      .from(agent);

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return data;
  })
});
