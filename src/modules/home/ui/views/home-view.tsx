"use client";

import { authClient } from "@/lib/auth-client";   

export const HomeView = () => {
  // Get the authenticated session
  const { data: session } = authClient.useSession();

  // Handle authentication loading
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <p className="text-lg">Loading authentication...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 gap-y-4">
      <div className="flex justify-between items-center">
        <p>Logged in as {session.user.name}</p>
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-[500px] p-4 mt-6 border rounded-lg">
        
        {
          <p className="text-lg">Loading tRPC data...</p>
        }
      </div>
    </div>
  );
};
