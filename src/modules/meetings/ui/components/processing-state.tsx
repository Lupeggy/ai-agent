"use client";

import { Loader2 } from "lucide-react";

export function ProcessingState() {
  return (
    <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-4 sm:p-6">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Processing meeting</h2>
      <p className="text-muted-foreground text-sm sm:text-base">
        Your meeting data is being processed. This may take a few minutes.
      </p>
    </div>
  );
}
