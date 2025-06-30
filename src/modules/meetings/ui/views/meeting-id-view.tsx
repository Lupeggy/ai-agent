"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { MeetingView } from "@/components/meeting-view";
import { MeetingStatusBadge } from "../components/meeting-status-badge";
import { notFound, useRouter } from "next/navigation";
import { format } from "date-fns";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { EditMeetingDialog } from "../components/edit-meeting-dialog";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const utils = trpc.useUtils();
  
  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Query to get meeting details
  const { data: meeting, error } = trpc.meetings.getOne.useQuery({ id: meetingId });
  
  // Query to get agent details if we have an agentId
  const { data: agent } = trpc.agents.getOne.useQuery(
    { id: meeting?.agentId || "" },
    { enabled: !!meeting?.agentId }
  );
  
  // Delete meeting mutation
  const { mutate: deleteMeeting, isPending: isDeleting } = trpc.meetings.remove.useMutation({
    onSuccess: () => {
      toast.success("Meeting deleted successfully");
      utils.meetings.getMany.invalidate();
      router.push('/meetings');
    },
    onError: (error) => {
      toast.error(`Failed to delete meeting: ${error.message}`);
    },
  });
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (meeting) {
      deleteMeeting({ id: meeting.id });
    }
    setDeleteDialogOpen(false);
  };
  
  const isActive = meeting?.status === "active";
  const isUpcoming = meeting?.status === "upcoming";
  const isCompleted = meeting?.status === "completed";
  const isProcessing = meeting?.status === "processing";
  const isCancelled = meeting?.status === "cancelled";

  
  // Handle edit button click
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  if (error) {
    if (error.data?.code === 'NOT_FOUND') {
      return notFound();
    }
    return <div>Error loading meeting: {error.message}</div>;
  }

  if (!meeting) {
    return <div>Loading meeting...</div>;
  }

  // Calculate duration text for rendering
  let durationText = "Not started";
  if (meeting.startedAt && meeting.endedAt) {
    const start = new Date(meeting.startedAt);
    const end = new Date(meeting.endedAt);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    durationText = `${minutes}m ${seconds}s`;
  } else if (meeting.startedAt) {
    durationText = "In progress";
  }

  return (
    <div className="space-y-6">
      <MeetingIdViewHeader 
        meetingId={meeting.id} 
        meetingName={meeting.name}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Meeting content using shared MeetingView component */}
      {meeting && (
        <MeetingView
          status={meeting.status}
          meetingDetails={{
            title: meeting.name,
            createdAt: new Date(meeting.createdAt),
            startedAt: meeting.startedAt ? new Date(meeting.startedAt) : null,
            endedAt: meeting.endedAt ? new Date(meeting.endedAt) : null
          }}
          agent={agent ? {
            id: agent.id,
            name: agent.name,
            avatarSeed: agent.id
          } : undefined}
          onStartMeeting={() => {
            toast.info("Starting meeting...");
            // Implement start meeting functionality here
          }}
          onJoinMeeting={() => {
            toast.info("Joining meeting...");
            // Implement join meeting functionality here  
          }}
          onCancelMeeting={() => {
            toast.info("Cancelling meeting...");
            // Implement cancel meeting functionality here
          }}
          className="mb-6"
        />
      )}
      
      {/* Edit Meeting Dialog */}
      {meeting && editDialogOpen && (
        <EditMeetingDialog
          open={true}
          onOpenChange={setEditDialogOpen}
          meeting={meeting}
        />
      )}
      
      {/* Delete Meeting Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
