import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { CallView } from "@/modules/call/ui/views/call-view";
import { Suspense } from "react";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";
import { CallErrorBoundary } from "@/modules/call/ui/component/call-error-boundary";

interface PageProps {
  params: { meetingId: string };
}

// Simple component that just passes the meetingId to CallView
const MeetingIdView = ({ meetingId }: { meetingId: string }) => {
  return <CallView meetingId={meetingId} />;
};

export default async function MeetingPage({ params }: PageProps) {
  // Properly await params to fix the Next.js error
  const { meetingId } = await Promise.resolve(params);
  
  // Get authenticated session for server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if no session
  if (!session) {
    redirect("/sign-in");
  }

  // Create query client instance for prefetching data
  const queryClient = getQueryClient();
  
  try {
    // Prefetch the meeting data
    await queryClient.prefetchQuery({
      queryKey: ['meetings', meetingId],
      queryFn: async () => {
        // Create server-side tRPC caller directly
        const caller = appRouter.createCaller({
          auth: { user: session.user }
        });
        // Call the procedure to get meeting data
        const data = await caller.meetings.getOne({ id: meetingId });
        console.log("Server-side prefetched meeting data:", data);
        return data;
      }
    });
  } catch (error) {
    console.error("Error prefetching meeting data:", error);
    // We'll continue rendering even if prefetch fails, client will retry
  }

  // Serialize the query client state
  const dehydratedState = dehydrate(queryClient);
  
  return (
    <div className="bg-[#1a1f2c] min-h-screen">
      <CallErrorBoundary>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-screen bg-[#1a1f2c] text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-medium text-gray-200">Loading meeting...</p>
          </div>
        }>
          <HydrationBoundary state={dehydratedState}>
            <MeetingIdView meetingId={meetingId} />
          </HydrationBoundary>
        </Suspense>
      </CallErrorBoundary>
    </div>
  );
}
