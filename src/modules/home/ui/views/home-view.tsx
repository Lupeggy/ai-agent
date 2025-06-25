"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export const HomeView = () => {
  // Get the authenticated session
  const { data: session } = authClient.useSession();
  
  // Get tRPC client and query the hello endpoint
  const trpc = useTRPC();
  const { data: tRPCData, isLoading: tRPCLoading, isError: tRPCError, error: tRPCErrorData } = 
    useQuery(trpc.hello.queryOptions({ text: "Antonio" }));

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
        <Button variant="outline" onClick={() => authClient.signOut()}>
          Sign out
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-[500px] p-4 mt-6 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-8">tRPC Data Test</h2>
        
        {tRPCLoading ? (
          <p className="text-lg">Loading tRPC data...</p>
        ) : tRPCError ? (
          <p className="text-lg text-red-500">
            Error loading tRPC data: {tRPCErrorData?.message || "Unknown error"}
          </p>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{tRPCData?.greeting}</h1>
            <p className="text-gray-500">Data successfully loaded from tRPC endpoint</p>
          </div>
        )}
      </div>
    </div>
  );
};
