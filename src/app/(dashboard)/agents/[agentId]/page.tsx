import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { AgentIdView, AgentIdViewLoading, AgentIdViewError } from "@/modules/agents/ui/views/agent-id-view";


interface prop {
    params: Promise<{ agentId: string }>
};

const Page = async ({ params }: prop) => {
    const {agentId} = await params;

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.agents.getOne.queryOptions({ id: agentId })
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<AgentIdViewLoading />}>
                <ErrorBoundary fallback={<AgentIdViewError />}>
                    <AgentIdView agentId={agentId} />
                </ErrorBoundary>
            </Suspense>

        </HydrationBoundary>
    );
    
};

export default Page;