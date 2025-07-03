"use client";

import { CheckCircle, Clock, User, Bot, Calendar, FileText, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { MeetingsGetOne } from "../../types";
import { StreamTranscriptItem } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Props for Message component
export interface MessageProps {
  isAgent: boolean;
  content: string;
  timestamp?: number;
  speakerName?: string;
  agentId?: string;
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
export function parseTranscript(transcript: string | null | undefined): StreamTranscriptItem[] {
  if (!transcript) return [];
  
  try {
    // Try to parse as JSON first
    return JSON.parse(transcript);
  } catch (e) {
    // If not JSON, return as a single item with the whole text
    return [{
      speaker_id: "unknown",
      type: "transcript",
      text: transcript,
      start_ts: 0,
      end_ts: 0
    }];
  }
};

// Message component for transcript display
export const Message = ({ isAgent, content, timestamp, speakerName, agentId }: MessageProps) => {
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isAgent ? "flex-row" : "flex-row-reverse"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isAgent ? "bg-blue-100" : "bg-gray-100"
      )}>
        {isAgent ? (
          <GeneratedAvatar 
            seed={agentId || "agent"} 
            variant="botttsNeutral" 
            className="w-8 h-8" 
          />
        ) : (
          <User className="h-4 w-4 text-gray-600" />
        )}
      </div>
      
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
        
        <div className={cn(
          "p-3 rounded-lg text-sm",
          isAgent ? "bg-blue-50 rounded-tl-none" : "bg-gray-50 rounded-tr-none"
        )}>
          {content}
        </div>
      </div>
    </div>
  );
};

export function CompletedState({ meeting, agentName, agentId, userName, startedAt: startedAtProp, endedAt: endedAtProp }: CompletedStateProps) {
  // Use direct props if provided, otherwise try to get from meeting object
  const startedAt = startedAtProp ?? meeting?.startedAt;
  const endedAt = endedAtProp ?? meeting?.endedAt;
  
  return (
    <div className="space-y-8">
      {/* Header section with completion status */}
      <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-4 sm:p-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Meeting completed</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          This meeting has ended
          {endedAt && ` on ${formatDate(endedAt)}`}
        </p>
      </div>
      
      {/* Meeting details card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
          <CardDescription>Information about this meeting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Started:</span>
                <span className="text-sm">{startedAt ? formatDate(startedAt) : "Not started"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ended:</span>
                <span className="text-sm">{endedAt ? formatDate(endedAt) : "Not ended"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Duration:</span>
                <span className="text-sm">{formatDuration(startedAt, endedAt)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Participant:</span>
                <span className="text-sm">{userName || "You"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Agent:</span>
                <div className="flex items-center gap-1">
                  {agentId && (
                    <GeneratedAvatar 
                      seed={agentId} 
                      variant="botttsNeutral" 
                      className="w-4 h-4" 
                    />
                  )}
                  <span className="text-sm">{agentName || "AI Assistant"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      

    </div>
  );
}
