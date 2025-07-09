"use client";

import { ErrorBoundary } from "react-error-boundary";

interface CallErrorBoundaryProps {
  children: React.ReactNode;
}

export function CallErrorBoundary({ children }: CallErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 rounded-lg bg-red-50 border border-red-100">
            <h3 className="text-lg font-medium text-red-800">Error loading meeting</h3>
            <p className="mt-2 text-sm text-red-600">
              There was a problem loading the meeting data. Please try again later.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
