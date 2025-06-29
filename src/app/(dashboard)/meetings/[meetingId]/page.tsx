import { MeetingIdView } from "@/modules/meetings/ui/views/meeting-id-view";
import { Suspense } from "react";

interface PageProps {
  params: {
    meetingId: string;
  };
}

const MeetingPage = ({ params }: PageProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MeetingIdView meetingId={params.meetingId} />
    </Suspense>
  );
};

export default MeetingPage;