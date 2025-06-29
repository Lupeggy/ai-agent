"use client";

import { useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { DataPagination } from "@/modules/agents/ui/components/data-pagination";
import { MeetingsGetMany } from "../../types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, PlusIcon } from "lucide-react";
import { useState } from "react";
import { MeetingListHeader } from "../components/meeting-list-header";
import { NewMeetingDialog } from "../components/new-meeting-dialog";

const MeetingsList = ({ meetings, onAddNewMeeting }: { meetings: MeetingsGetMany[], onAddNewMeeting: () => void }) => {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center h-[450px]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Video className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">No Meetings Found</h2>
        <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
          You haven't created any meetings yet.
        </p>
        <Button onClick={onAddNewMeeting} className="mt-6">
          Create Meeting
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <Link href={`/meetings/${meeting.id}`} key={meeting.id}>
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader>
              <CardTitle className="truncate">{meeting.name}</CardTitle>
              <CardDescription>
                {new Date(meeting.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge
                variant={meeting.status === "completed" ? "default" : "secondary"}
              >
                {meeting.status}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export const MeetingsView = () => {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false);

  const { data, isLoading } = trpc.meetings.getMany.useQuery({ page, search });

  const handleAddNewMeeting = () => {
    setIsNewMeetingDialogOpen(true);
  };

  const totalMeetings = data?.data?.length || 0;

  return (
    <div className="space-y-6">
      {/* New Meeting Dialog */}
      <NewMeetingDialog 
        open={isNewMeetingDialogOpen}
        onOpenChange={setIsNewMeetingDialogOpen}
      />

      {/* Header with search and button */}
      <MeetingListHeader 
        totalMeetings={totalMeetings} 
        onAddNewMeeting={handleAddNewMeeting}
        searchValue={search}
      />

      {isLoading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-[170px] animate-pulse bg-muted/50" />
            ))}
        </div>
      ) : (
        <MeetingsList 
          meetings={data?.data ?? []} 
          onAddNewMeeting={handleAddNewMeeting}
        />
      )}

      {data && data.totalPages > 1 && (
        <DataPagination currentPage={page} totalPages={data.totalPages} />
      )}
    </div>
  );
};