"use client";

import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const { data: meeting, error } = trpc.meetings.getOne.useQuery({ id: meetingId });

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{meeting.name}</h1>
        <Badge variant={meeting.status === "completed" ? "default" : "secondary"} className="mt-2">
          {meeting.status}
        </Badge>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-semibold">Created:</span> {new Date(meeting.createdAt).toLocaleString()}</p>
            {meeting.startedAt && <p><span className="font-semibold">Started:</span> {new Date(meeting.startedAt).toLocaleString()}</p>}
            {meeting.endedAt && <p><span className="font-semibold">Ended:</span> {new Date(meeting.endedAt).toLocaleString()}</p>}
          </CardContent>
        </Card>
        {/* We can add Agent details card here later */}
      </div>

      {/* Transcript and Summary will go here */}
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
