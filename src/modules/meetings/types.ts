import { Agent } from "../agents/ui/components/columns";

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
  agent?: Agent | null; // Add optional agent property
};

export type StreamTranscriptItem = {
  speaker_id: string;
  type: string;
  text: string;
  start_ts: number;
  end_ts: number;
};


// Using the same type for individual meeting details
export type MeetingsGetOne = MeetingsGetMany;
