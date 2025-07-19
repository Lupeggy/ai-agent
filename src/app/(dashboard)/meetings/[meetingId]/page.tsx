import { MeetingIdView } from "@/modules/meetings/ui/views/meeting-id-view";
import { Suspense } from "react";

interface PageProps {
  params: {
    meetingId: string;
  };
}

export default async function MeetingPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MeetingIdView meetingId={params.meetingId} />
    </Suspense>
  );
}