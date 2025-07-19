import { z } from "zod";

export const meetingSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  agentId: z.string().min(1, { message: "Agent is required" }),
  status: z.enum(['upcoming', 'active', 'completed', 'processing', 'cancelled']).optional(),
});

export const meetingInsertSchema = meetingSchema;

export const meetingUpdateSchema = meetingSchema.extend({
  id: z.string().min(1),
});