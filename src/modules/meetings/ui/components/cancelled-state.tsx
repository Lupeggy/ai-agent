"use client";

import { XCircle } from "lucide-react";

export function CancelledState() {
  return (
    <div className="flex flex-col items-center justify-center relative z-10 max-w-md mx-auto text-center p-4 sm:p-6">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Meeting cancelled</h2>
      <p className="text-muted-foreground text-sm sm:text-base">
        This meeting has been cancelled and is no longer available
      </p>
    </div>
  );
}
