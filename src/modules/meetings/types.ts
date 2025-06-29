export type MeetingsGetMany = {
  id: string;
  name: string;
  status: "upcoming" | "active" | "completed" | "processing" | "cancelled";
  createdAt: Date | string;
  updatedAt?: Date | string;
  userId: string;
  agentId: string;
  startedAt: Date | string | null;
  endedAt: Date | string | null;
  transcript: string | null;
  recordingUrl: string | null;
  summary: string | null;
};
