"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/trpc/client";
import { MeetingForm } from "./meeting-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MeetingsGetOne } from "../../../meetings/types";

interface EditMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: MeetingsGetOne;
}

export function EditMeetingDialog({ open, onOpenChange, meeting }: EditMeetingDialogProps) {
  // Use TRPC directly as it's used in other components
  const utils = trpc.useContext();
  
  const { mutate: updateMeeting, isPending: isLoading } = trpc.meetings.update.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.meetings.getOne.invalidate({ id: meeting.id });
      utils.meetings.getMany.invalidate();
      
      toast.success("Meeting updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update meeting");
    }
  });

  const handleUpdate = (values: any) => {
    updateMeeting({
      id: meeting.id,
      ...values
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
          <DialogDescription>
            Update the meeting information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <MeetingForm 
            onSubmit={handleUpdate} 
            isSubmitting={isLoading} 
            submitLabel="Save Changes"
            defaultValues={{
              name: meeting.name,
              agentId: meeting.agentId,
              status: meeting.status,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
