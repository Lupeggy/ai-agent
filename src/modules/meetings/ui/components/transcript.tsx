 import { useState } from "react";
import { format } from "date-fns";
import { SearchIcon, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Highlighter from "react-highlight-words";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/trpc/client";
import { generateAvatarUrl, cn } from "@/lib/utils";

interface TranscriptProps {
  meetingId: string;
  meetingStatus: "upcoming" | "active" | "completed" | "processing" | "cancelled";
}

interface TranscriptMessage {
  messageId: string;
  speakerId: string;
  speakerName?: string;
  speakerImage?: string;
  content: string;
  timestamp?: number;
}

interface LegacyTranscriptMessage {
  speaker_id: string;
  type: string;
  text: string;
  timestamp?: number;
  user?: {
    name: string;
    image: string;
  };
}

interface TranscriptResponse {
  messages: TranscriptMessage[];
}

interface Props {
  meetingId: string;
  meetingStatus?: string;
}

export const Transcript = ({ meetingId, meetingStatus }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch transcript data using TRPC
  const { data: transcriptData, isLoading, error } = trpc.meetings.getTranscript.useQuery(
    { id: meetingId },
    {
      enabled: meetingId !== "" && (meetingStatus === "completed" || meetingStatus === "processing"),
      refetchOnWindowFocus: false,
    }
  );

  // Function to parse legacy transcript format if needed
  const parseTranscript = (transcriptText: string): LegacyTranscriptMessage[] => {
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(transcriptText);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // If not an array, try to parse as JSONL
      return transcriptText
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch (e) {
      console.error("Failed to parse transcript:", e);
      return [];
    }
  };

  // Format timestamp to readable time
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "";
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (e) {
      return "";
    }
  };

  // Render a single message
  const renderMessage = (message: TranscriptMessage, index: number) => {
    return (
      <div
        key={`message-${index}`}
        className={cn(
          "flex gap-4 py-4 border-b border-border",
          message.speakerId === "assistant" ? "bg-muted/30" : "bg-background"
        )}
      >
        <div className="flex-shrink-0 pt-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.speakerImage || generateAvatarUrl({ seed: message.speakerId, variant: "identicon" })} alt={message.speakerName || ""} />
            <AvatarFallback>{message.speakerName?.[0] || "?"}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{message.speakerName || "Unknown"}</p>
            {message.timestamp && (
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>
          <div className="text-sm prose prose-sm max-w-none">
            {searchQuery ? (
              <ReactMarkdown>
                {message.content.split(searchQuery).join(`**${searchQuery}**`)}
              </ReactMarkdown>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Handle legacy transcript format
  const renderLegacyMessage = (message: LegacyTranscriptMessage, index: number) => {
    const isAgent = message.speaker_id === "assistant";
    const speakerName = isAgent
      ? message.user?.name || "Assistant"
      : message.user?.name || "User";
    return (
      <div 
        key={`legacy-message-${index}`} 
        className={cn(
          "flex gap-4 py-4 border-b border-border",
          isAgent ? "bg-muted/30" : "bg-background"
        )}
      >
        <div className="flex-shrink-0 pt-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.user?.image || generateAvatarUrl({ seed: message.speaker_id, variant: "identicon" })} alt={speakerName} />
            <AvatarFallback>{speakerName[0] || "?"}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{speakerName}</span>
            {message.timestamp && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.timestamp), "h:mm a")}
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-sm">
            {searchQuery ? (
              <Highlighter
                highlightClassName="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
                searchWords={[searchQuery]}
                autoEscape={true}
                textToHighlight={message.text}
              />
            ) : (
              <p>{message.text}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-4">
        <p className="text-sm text-error">Failed to load transcript.</p>
      </div>
    );
  }

  if (!transcriptData) {
    return (
      <div className="flex justify-center p-4">
        <p className="text-sm text-muted-foreground">No transcript available.</p>
      </div>
    );
  }

  // Handle both enriched transcript data and legacy format
  let messages: TranscriptMessage[] = [];
  let legacyMessages: LegacyTranscriptMessage[] = [];
  let isLegacyFormat = false;

  if (transcriptData && typeof transcriptData === 'object' && 'messages' in transcriptData && Array.isArray(transcriptData.messages)) {
    // Use enriched transcript data from API
    messages = transcriptData.messages;
  } else if (typeof transcriptData === 'string') {
    // Parse legacy transcript format
    isLegacyFormat = true;
    legacyMessages = parseTranscript(transcriptData);
  } else if (Array.isArray(transcriptData)) {
    // Handle case where API returns array directly
    isLegacyFormat = true;
    legacyMessages = transcriptData as unknown as LegacyTranscriptMessage[];
  }
  
  // Filter messages by search query if needed
  const filteredMessages = searchQuery
    ? messages.filter(message => 
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (message.speakerName && message.speakerName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;
    
  // Filter legacy messages by search query if needed
  const filteredLegacyMessages = searchQuery
    ? legacyMessages.filter(message => 
        message.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (message.user?.name && message.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : legacyMessages;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript"
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLegacyFormat ? (
            filteredLegacyMessages.length > 0 ? (
              filteredLegacyMessages.map((message, index) => renderLegacyMessage(message, index))
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery ? "No matching messages found." : "No transcript messages available."}
              </p>
            )
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((message, index) => renderMessage(message, index))
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery ? "No matching messages found." : "No transcript messages available."}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
    };
