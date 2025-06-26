import { z } from "zod";

export const agentSchema = z.object({
    name: z.string().min(1, { message:"Name is required"}),
    instructions: z.string().min(1, { message:"Instructions is required"}),
});

export const agentInsertSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    instructions: z.string().min(1, { message: "Instructions are required" }),
});