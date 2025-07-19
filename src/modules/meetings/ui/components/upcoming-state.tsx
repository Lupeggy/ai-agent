"use client";

import { Button } from "@/components/ui/button";
import { Clock, Play } from "lucide-react";

interface UpcomingStateProps {
  onStartMeeting?: () => void;
  onCancelMeeting?: () => void;
}

export function UpcomingState({ onStartMeeting, onCancelMeeting }: UpcomingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Not started yet</h2>
      <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
        Once you start this meeting, a summary will appear here
      </p>
      <div className="flex justify-center w-full">
        <Button 
          className="gap-2 bg-green-500 hover:bg-green-600 w-full sm:w-auto" 
          onClick={onStartMeeting}
        >
          <Play className="h-4 w-4" /> Join meeting
        </Button>
      </div>
    </div>
  );
}
