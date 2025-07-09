"use client";

import { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { CallConnect } from "./call-connect";
import { generateAvatar } from "@/lib/stream-video";

interface CallProviderProps {
  children: ReactNode;
  meetingId: string;
  meetingName?: string;
}

/**
 * CallProvider component that acts as a wrapper for the Stream Video call functionality.
 * Provides authenticated user information and meeting context to the CallConnect component.
 */
export const CallProvider = ({ children, meetingId, meetingName }: CallProviderProps) => {
  // Get authenticated session data
  const { data: session, isPending } = authClient.useSession();
  
  // Show loading state while session is loading
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no authenticated user, show auth required message
  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="mb-4">You need to be signed in to join a video call.</p>
        </div>
      </div>
    );
  }

  // Use the provided meeting name or a default value
  const displayMeetingName = meetingName || "Video Call";

  // Generate avatar URL if user doesn't have an image
  const userImage = session.user.image || generateAvatar(session.user.name || session.user.email || "User");

  // Now use the CallConnect component with the authenticated user information
  // Only pass props that are defined in the CallConnectProps interface
  return (
    <CallConnect 
      meetingId={meetingId}
      meetingName={displayMeetingName}
      userId={session.user.id}
      userName={session.user.name || session.user.email || "User"}
      userImage={userImage}
    >
      {children}
    </CallConnect>
  );
};
