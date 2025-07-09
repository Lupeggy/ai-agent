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

// Raw transcript item from Stream API
export type StreamTranscriptItem = {
  text: string;
  user_id: string;
  created_at: string;
  type?: string;
  id?: string;
  session_id?: string;
};

// Processed transcript item with speaker info
export type ProcessedTranscriptItem = {
  id: string;
  text: string;
  userId: string;
  speaker: {
    id: string;
    name: string;
    image?: string | null;
    isAgent: boolean;
  };
  timestamp: string;
  type?: string;
};


// Using the same type for individual meeting details
export type MeetingsGetOne = MeetingsGetMany;
