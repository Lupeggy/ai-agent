"use client";

import { CheckCircle } from "lucide-react";

interface CompletedStateProps {
  endedAt?: Date | null;
}

export function CompletedState({ endedAt }: CompletedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-4 sm:p-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Meeting completed</h2>
      <p className="text-muted-foreground text-sm sm:text-base">
        This meeting has ended
        {endedAt && ` on ${endedAt.toLocaleDateString()} at ${endedAt.toLocaleTimeString()}`}
      </p>
    </div>
  );
}
