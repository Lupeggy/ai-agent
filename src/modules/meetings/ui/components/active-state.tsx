"use client";

import { Button } from "@/components/ui/button";
import { VideoIcon } from "lucide-react";

interface ActiveStateProps {
  onJoinMeeting?: () => void;
}

export function ActiveState({ onJoinMeeting }: ActiveStateProps) {
  return (
    <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Meeting is active</h2>
      <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
        Meeting will end once all participants have left
      </p>
      <Button 
        onClick={onJoinMeeting}
        className="gap-2 bg-green-500 hover:bg-green-600 w-full sm:w-auto" 
      >
        <VideoIcon className="h-4 w-4" /> Join meeting
      </Button>
      
      {/* Progress bar for active meetings */}
      <div className="absolute top-0 left-0 right-0 h-1.5">
        <div className="bg-green-500 h-full w-full animate-pulse opacity-75"></div>
      </div>
    </div>
  );
}
