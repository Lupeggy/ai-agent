"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Clock, Video, Calendar } from "lucide-react";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { format, formatDistanceToNow } from "date-fns";
import { MeetingsGetMany } from "../../types";
import { trpc } from "@/trpc/client";
import { useState, useEffect } from "react";
import { MeetingStatusBadge } from "./meeting-status-badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Create a separate agent display component that can fetch and display agent details
const AgentDisplay = ({ agentId }: { agentId: string | undefined }) => {
  // Only query if we have an agentId
  const { data: agent } = trpc.agents.getOne.useQuery(
    { id: agentId || "" },
    { enabled: !!agentId }
  );

  if (!agentId) return <span>No agent assigned</span>;

  return (
    <span className="flex items-center gap-1">
      <GeneratedAvatar 
        seed={agentId} 
        variant="botttsNeutral" 
        className="w-4 h-4" 
      />
      {agent?.name || agentId}
    </span>
  );
};

// Format date in a consistent way
const formatDate = (date: Date | string | null) => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy 'at' h:mm a");
};

export const columns: ColumnDef<MeetingsGetMany>[] = [
  {
    id: 'meetingDetails',
    // We use a custom cell renderer for the entire row's content
    cell: ({ row }) => {
      const meeting = row.original;
      const router = useRouter();

      // Determine the duration display
      const hasDuration = meeting.startedAt && meeting.endedAt;
      let durationText = "No Duration";
      
      if (hasDuration && meeting.startedAt && meeting.endedAt) {
        const start = new Date(meeting.startedAt);
        const end = new Date(meeting.endedAt);
        const durationMs = end.getTime() - start.getTime();
        const durationMinutes = Math.round(durationMs / 60000);
        durationText = `${durationMinutes} min`;
      }
      
      // Format date for display
      const startDate = meeting.startedAt ? formatDate(meeting.startedAt) : "Not started";

      const handleRowClick = () => {
        router.push(`/meetings/${meeting.id}`);
      };

      return (
        <div 
          className="flex items-center justify-between w-full p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={handleRowClick}
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="font-semibold text-lg">{meeting.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>&#8627;</span>
                <AgentDisplay agentId={meeting.agentId} />
              </div>
              {meeting.startedAt && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {startDate}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <MeetingStatusBadge status={meeting.status} />
            </div>

            {/* Duration info */}
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">
                {durationText}
              </span>
            </div>
            
            {/* View button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/meetings/${meeting.id}`);
              }}
            >
              View
            </Button>
          </div>
        </div>
      )
    }
  }
]
