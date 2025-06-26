import { Suspense } from "react";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";

import { ErrorBoundary } from "react-error-boundary";

import { 
    AgentsView, 
    AgentViewLoading, 
    AgentsViewError
} from "@/modules/agents/ui/views/agents-view";




const Page = async () => {
  const queryClient = getQueryClient();
  
  // Prefetch the agents data on the server
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<AgentViewLoading />}>
        <ErrorBoundary fallback={<AgentsViewError />}>
            <AgentsView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;