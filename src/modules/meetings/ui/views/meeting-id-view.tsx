"use client";

import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { format } from "date-fns";



interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const { data: meeting, error } = trpc.meetings.getOne.useQuery({ id: meetingId });
  const { data: agent } = trpc.agents.getOne.useQuery(
    { id: meeting?.agentId || "" },
    { enabled: !!meeting?.agentId }
  );
  
  const handleBack = () => {
    router.push('/meetings');
  };

  if (error) {
    if (error.data?.code === 'NOT_FOUND') {
      notFound();
    }
    // Handle other errors if needed
    return <div>Error loading meeting.</div>;
  }

  if (!meeting) {
    return <div>Loading...</div>;
  }

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
  
  // Format the status badge
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case "upcoming": return "outline";
      case "active": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Meetings
        </Button>
      </div>

      {/* Meeting header with avatar and meeting details */}
      <div className="rounded-lg border shadow-sm">
        <div className="flex items-center justify-between w-full p-6">
          <div className="flex items-center gap-4">
            <GeneratedAvatar seed={meeting.name} variant="botttsNeutral" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{meeting.name}</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>&#8627;</span>
                <span>{agent?.name || "No agent assigned"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status badge */}
            <Badge variant={getStatusBadgeVariant(meeting.status)} className="capitalize">
              {meeting.status}
            </Badge>

            {/* Duration info */}
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">
                {durationText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting details cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-semibold">Created:</span> {format(new Date(meeting.createdAt), 'PPpp')}</p>
            {meeting.startedAt && <p><span className="font-semibold">Started:</span> {format(new Date(meeting.startedAt), 'PPpp')}</p>}
            {meeting.endedAt && <p><span className="font-semibold">Ended:</span> {format(new Date(meeting.endedAt), 'PPpp')}</p>}
          </CardContent>
        </Card>
        
        {agent && (
          <Card>
            <CardHeader>
              <CardTitle>Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-3 mb-2">
                <GeneratedAvatar seed={agent.name} variant="botttsNeutral" className="w-8 h-8" />
                <p className="font-semibold">{agent.name}</p>
              </div>
              <p className="line-clamp-3 text-muted-foreground">{agent.instructions}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transcript and Summary */}
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Transcript will be available after the meeting is completed.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">A summary will be generated after the meeting is completed.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
