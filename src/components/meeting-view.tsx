"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
  const isActive = status === "active";
  const isUpcoming = status === "upcoming";
  const isCompleted = status === "completed";

  return (
    <div className={cn("rounded-lg border shadow-sm bg-card", className)}>
      <div className="p-6 flex flex-col md:flex-row gap-8">
        {/* Left side: Video placeholder and controls */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="aspect-video rounded-lg bg-muted relative flex items-center justify-center border shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted opacity-10"></div>
            <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-6">
              {/* Camera icon in circle */}
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <VideoIcon className="h-12 w-12 text-muted-foreground/40" />
              </div>
              
              {isActive ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">Meeting is active</h2>
                  <p className="text-muted-foreground mb-8">
                    Meeting will end once all participants have left
                  </p>
                  <Button 
                    onClick={onJoinMeeting}
                    className="gap-2 bg-green-500 hover:bg-green-600" 
                    size="lg"
                  >
                    <VideoIcon className="h-4 w-4" /> Join meeting
                  </Button>
                </>
              ) : isUpcoming ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">Not started yet</h2>
                  <p className="text-muted-foreground mb-8">
                    Once you start this meeting, a summary will appear here
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="gap-2"
                      onClick={onCancelMeeting}
                    >
                      <Clock className="h-4 w-4" /> Cancel meeting
                    </Button>
                    <Button 
                      className="gap-2 bg-green-500 hover:bg-green-600" 
                      size="lg"
                      onClick={onStartMeeting}
                    >
                      <Play className="h-4 w-4" /> Start meeting
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    {isCompleted ? "Meeting completed" : "Meeting not available"}
                  </h2>
                  <p className="text-muted-foreground">
                    {isCompleted 
                      ? "This meeting has ended" 
                      : "This meeting cannot be started at this time"}
                  </p>
                </>
              )}
            </div>
            
            {/* Progress bar at the top - shown for active meetings */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0">
                <div className="w-1/2 h-1 bg-green-500"></div>
              </div>
            )}
          </div>

          {/* Status and duration */}
          <div className="flex items-center gap-2 py-2">
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{
                isActive ? 'In progress' : 
                isUpcoming ? 'Scheduled' : 
                isCompleted ? 'Completed' : 'N/A'
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
                {isActive 
                  ? "Transcript will be available after the meeting ends" 
                  : isUpcoming 
                    ? "Transcript will be available after the meeting starts"
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
                {isCompleted 
                  ? "Meeting summary will be generated shortly" 
                  : "A summary will be generated after the meeting ends"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side: Details and Agent */}
        <div className="w-full md:w-1/3 space-y-6">
          {/* Details card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">Title:</span> {meetingDetails.title}</p>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <p className="font-semibold">{agent.name}</p>
                </div>
                
                <Separator className="my-3" />
                
                {/* Conversation demo */}
                <div className="space-y-3 mt-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">U</span>
                    </div>
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground">User</p>
                      <p>hello</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">{agent.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="text-sm">
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
