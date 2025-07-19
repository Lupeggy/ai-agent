"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import dynamic from "next/dynamic";
import { HydrationBoundary } from "@tanstack/react-query";
import { AgentViewLoading, AgentsViewError } from "@/modules/agents/ui/views/agents-view";

// Use Next.js dynamic import with SSR disabled to prevent hydration mismatches
const AgentsViewNoSSR = dynamic(
  () => import("@/modules/agents/ui/views/agents-view").then((mod) => mod.AgentsView),
  { ssr: false }
);

interface ClientPageProps {
  dehydratedState: any;
}

export const ClientPage = ({ dehydratedState }: ClientPageProps) => {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense fallback={<AgentViewLoading />}>
        <ErrorBoundary fallback={<AgentsViewError />}>
          <AgentsViewNoSSR />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};
