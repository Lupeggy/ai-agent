"use client";

import { Sparkles, CheckCircle, Bot, Calendar, Clock, User, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

import { cn as classNames } from "@/lib/utils";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { MeetingsGetOne, ProcessedTranscriptItem } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

// Helper functions are defined below

// Props for Message component
export interface MessageProps {
  isAgent: boolean;
  content: string;
  timestamp?: number;
  speakerName?: string;
  agentId?: string;
  speakerImage?: string | null;
}

// Props for CompletedState component
export interface CompletedStateProps {
  meeting?: MeetingsGetOne;
  agentName?: string;
  agentId?: string;
  userName?: string;
  // Allow individual props to be passed directly for simpler usage
  startedAt?: Date | string | null;
  endedAt?: Date | string | null;
  summary?: string | null;
}

// Format date in a consistent way
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy 'at' h:mm a");
};

// Format duration between two dates
const formatDuration = (startDate: Date | string | null | undefined, endDate: Date | string | null | undefined) => {
  if (!startDate || !endDate) return "No duration";
  
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  
  const durationMs = end.getTime() - start.getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  return `${minutes}m ${seconds}s`;
};

// Parse transcript string into structured format for display
export function parseTranscript(transcript: string | null | undefined): ProcessedTranscriptItem[] {
  if (!transcript) return [];
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(transcript);
    
    // Check if the parsed data needs transformation
    if (Array.isArray(parsed) && parsed.length > 0) {
      // If it's using the old format (StreamTranscriptItem) or raw format, convert it
      if ('user_id' in parsed[0]) {
        // Raw format from Stream API - transform to processed format
        return parsed.map(item => ({
          id: item.id || `${item.user_id}-${item.created_at}`,
          text: item.text,
          userId: item.user_id,
          timestamp: item.created_at,
          type: item.type || 'transcript',
          speaker: {
            id: item.user_id,
            name: item.user?.name || 'Unknown',
            image: null,
            isAgent: item.user_id.startsWith('agent-')
          }
        }));
      } else {
        // Already in processed format
        return parsed;
      }
    }
    
    return parsed;
  } catch (e) {
    // If not JSON, return as a single item with the whole text
    return [{
      id: `unknown-${Date.now()}`,
      userId: "unknown",
      text: transcript,
      timestamp: new Date().toISOString(),
      type: "transcript",
      speaker: {
        id: "unknown",
        name: "Unknown",
        image: null,
        isAgent: false
      }
    }];
  }
};

// Message component for transcript display
export const Message = ({ isAgent, content, timestamp, speakerName, agentId, speakerImage }: MessageProps) => {
  return (
    <div className={classNames(
      "flex gap-3 mb-4",
      isAgent ? "flex-row" : "flex-row-reverse"
    )}>
      <Avatar className="size-8">
        <AvatarImage
          src={
            speakerImage || 
            (isAgent
              ? `/api/avatar?seed=${agentId || "agent"}&variant=botttsNeutral`
              : `/api/avatar?seed=${speakerName || "you"}&variant=initials`)
          }
          alt={`${speakerName || (isAgent ? "Agent" : "You")} Avatar`}
        />
      </Avatar>
      
      <div className="flex-1 max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {speakerName || (isAgent ? "Agent" : "You")}
          </span>
          {timestamp !== undefined && timestamp > 0 && (
            <span className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className={classNames(
          "p-3 rounded-lg text-sm",
          isAgent ? "bg-blue-50 rounded-tl-none" : "bg-gray-50 rounded-tr-none"
        )}>
          {content}
        </div>
      </div>
    </div>
  );
};

export const CompletedState = ({ 
  meeting, 
  agentName, 
  agentId, 
  userName, 
  startedAt: startedAtProp, 
  endedAt: endedAtProp,
  summary: summaryProp
}: CompletedStateProps) => {
  // Use direct props if provided, otherwise try to get from meeting object
  const startedAt = startedAtProp ?? meeting?.startedAt;
  const endedAt = endedAtProp ?? meeting?.endedAt;
  const summary = summaryProp ?? meeting?.summary;
  const meetingName = meeting?.name || "Meeting Summary";
  
  return (
    <div className="space-y-6">
      {/* Summary section with improved structure */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-5 gap-y-5 flex flex-col">
          {/* Meeting name header */}
          <h2 className="text-2xl font-medium capitalize">{meetingName}</h2>
          
          {/* Agent information with link */}
          {agentId && (
            <div className="flex gap-x-2 items-center mb-4">
              <Link
                href={`/agents/${agentId}`}
                className="flex items-center gap-x-2 underline underline-offset-4 capitalize"
              >
                <GeneratedAvatar
                  variant="botttsNeutral"
                  seed={agentId}
                  className="size-5"
                />
                <span>{agentName || "AI Assistant"}</span>
              </Link>
            </div>
          )}
          
          {/* Meeting timestamps */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            {startedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Started: {formatDate(startedAt)}</span>
              </div>
            )}
            {endedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Duration: {formatDuration(startedAt, endedAt)}</span>
              </div>
            )}
          </div>
          
          {/* Summary content */}
          {summary ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-medium">Generated Summary</h3>
              </div>
              <div className="prose prose-sm max-w-none border-t pt-4">
                <ReactMarkdown
                  components={{
                    h1: (props) => <h1 className="text-2xl font-medium mb-4" {...props} />,
                    h2: (props) => <h2 className="text-xl font-medium mb-3" {...props} />,
                    h3: (props) => <h3 className="text-lg font-medium mb-3 mt-4" {...props} />,
                    h4: (props) => <h4 className="text-base font-medium mb-2 mt-3" {...props} />,
                    ul: (props) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                    ol: (props) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                    li: (props) => <li className="mb-1" {...props} />,
                    p: (props) => <p className="mb-3" {...props} />,
                    code: (props) => <code className="bg-gray-100 p-1 rounded text-sm" {...props} />,
                    blockquote: (props) => <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />,
                  }}
                >
                  {summary}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 border-t mt-4">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <div className="text-center">
                  <p className="font-medium">Generating summary...</p>
                  <p className="text-sm text-muted-foreground">Our AI is analyzing the transcript</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
