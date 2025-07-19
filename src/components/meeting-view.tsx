"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ActiveState } from "@/modules/meetings/ui/components/active-state";
import { UpcomingState } from "@/modules/meetings/ui/components/upcoming-state";
import { CompletedState } from "@/modules/meetings/ui/components/completed-state";
import { ProcessingState } from "@/modules/meetings/ui/components/processing-state";
import { CancelledState } from "@/modules/meetings/ui/components/cancelled-state";

interface MeetingViewProps {
  status: "upcoming" | "active" | "completed" | "processing" | "cancelled";
  onStartMeeting?: () => void;
  onJoinMeeting?: () => void;
  onCancelMeeting?: () => void;
  meetingDetails: {
    title: string;
    createdAt: Date;
    startedAt?: Date | null;
    endedAt?: Date | null;
  };
  agent?: {
    id: string;
    name: string;
    avatarSeed?: string;
  };
  className?: string;
}

export function MeetingView({
  status,
  onStartMeeting,
  onJoinMeeting,
  onCancelMeeting,
  meetingDetails,
  agent,
  className,
}: MeetingViewProps) {

  return (
    <div className={cn("rounded-lg border shadow-sm bg-card", className)}>
      <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-8">
        {/* Left side: Video placeholder and controls */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="aspect-video rounded-lg bg-muted relative flex items-center justify-center border shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted opacity-10"></div>
            
            {/* Camera icon in circle - always shown */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-muted flex items-center justify-center opacity-20">
              <VideoIcon className="h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground/40" />
            </div>
            
            {/* Render different state components based on status */}
            {status === "active" ? (
              <ActiveState onJoinMeeting={onJoinMeeting} />
            ) : status === "upcoming" ? (
              <UpcomingState onStartMeeting={onStartMeeting} onCancelMeeting={onCancelMeeting} />
            ) : status === "completed" ? (
              <CompletedState endedAt={meetingDetails.endedAt} />
            ) : status === "processing" ? (
              <ProcessingState />
            ) : status === "cancelled" ? (
              <CancelledState />
            ) : (
              <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Meeting not available</h2>
                <p className="text-muted-foreground text-sm sm:text-base">This meeting cannot be accessed at this time</p>
              </div>
            )}
            
            {/* Progress bar is handled inside ActiveState component */}
          </div>

          {/* Status and duration */}
          <div className="flex items-center gap-2 py-2">
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{
                status === "active" ? 'In progress' : 
                status === "upcoming" ? 'Scheduled' : 
                status === "completed" ? 'Completed' : 
                status === "processing" ? 'Processing' :
                status === "cancelled" ? 'Cancelled' : 'N/A'
              }</span>
            </div>
          </div>

          {/* Transcript section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {status === "active"  
                  ? "Transcript will be available after the meeting ends" 
                  : status === "upcoming" 
                    ? "Transcript will be available after the meeting starts"
                    : status === "processing"
                      ? "Transcript is being processed..."
                      : "No transcript available"}
              </p>
            </CardContent>
          </Card>

          {/* Summary section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {status === "completed" 
                  ? "Meeting summary will be generated shortly" 
                  : status === "processing"
                    ? "Your meeting summary is being processed..."
                    : status === "cancelled"
                      ? "No summary available for cancelled meetings"
                      : "A summary will be generated after the meeting ends"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side: Details and Agent */}
        <div className="w-full md:w-1/3 space-y-4 sm:space-y-6">
          {/* Details card */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">Title:</span> {meetingDetails.title}</p>
              <p><span className="font-semibold">Status:</span> <span className={cn(
                status === "active" && "text-green-600",
                status === "upcoming" && "text-blue-600",
                status === "completed" && "text-slate-600",
                status === "processing" && "text-amber-600",
                status === "cancelled" && "text-red-600"
              )}>{status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
              <p><span className="font-semibold">Created:</span> {meetingDetails.createdAt.toLocaleString()}</p>
              {meetingDetails.startedAt && (
                <p><span className="font-semibold">Started:</span> {meetingDetails.startedAt.toLocaleString()}</p>
              )}
              {meetingDetails.endedAt && (
                <p><span className="font-semibold">Ended:</span> {meetingDetails.endedAt.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          {/* Agent card */}
          {agent && (
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-lg">Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium">
                      {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <p className="font-semibold text-sm sm:text-base">{agent.name}</p>
                </div>
                
                <Separator className="my-2 sm:my-3" />
                
                {/* Conversation demo */}
                <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">U</span>
                    </div>
                    <div className="text-xs sm:text-sm">
                      <p className="text-xs text-muted-foreground">User</p>
                      <div className="h-full bg-black/10 flex items-center justify-center">
                        {status === "active" && (
                          <p className="text-xs text-white/70 px-2">Recording live...</p>
                        )}
                      </div>
                      <p>hello</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">{agent.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="text-xs sm:text-sm">
                      <p className="text-xs text-muted-foreground">{agent.name}</p>
                      <p>heloooooo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
