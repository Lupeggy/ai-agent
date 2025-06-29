export type MeetingsGetMany = {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  createdAt: Date;
  userId: string;
  agentId: string;
  startedAt: Date | null;
  endedAt: Date | null;
};
