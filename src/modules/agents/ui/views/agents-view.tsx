"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useAgentsFilter } from "../../hooks/use-agents-filter";
import { ErrorState } from "@/components/error-state";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/modules/agents/ui/components/data-table";
import { columns, Agent } from "@/modules/agents/ui/components/columns";
import { AgentListHeader } from "@/modules/agents/ui/components/agent-list-header";
import { NewAgentDialog } from "../components/new-agent-dialog";
import { NewAgentButton } from "../components/new-agent-button";
import { DataPagination } from "../components/data-pagination";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "../client-only-view";


export const AgentViewLoading = () => {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col items-center w-full max-w-xs">
                <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Agents</h2>
                <p className="text-gray-500 text-center">Please wait while we retrieve your agents...</p>
            </div>
        </div>
    );
};

export const AgentsViewError = () => {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-xl shadow-lg border border-red-100 px-8 py-10 flex flex-col items-center w-full max-w-md">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-500 text-center mb-6">We couldn't load your agents. Please try again later.</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Try Again
                </button>
            </div>
        </div>
    );
};





export const AgentsView = () => {
  return (
    <ClientOnly>
      <AgentsContent />
    </ClientOnly>
  );
};

// Actual content component that only renders on the client
const AgentsContent = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [filter, setFilter] = useAgentsFilter();
  const [isNewAgentDialogOpen, setIsNewAgentDialogOpen] = React.useState(false);
  
  // Use useQuery with consistent behavior
  const { data: result, isLoading, isError, error } = useQuery({
    ...trpc.agents.getMany.queryOptions(filter),
    // Don't throw errors so we can handle them gracefully
    throwOnError: false,
  });

  // Handle loading state
  if (isLoading) {
    return <AgentViewLoading />;
  }



  // Now that we're mounted on client, we can show different states
  // Handle unauthorized errors (user not logged in)
  if (isError && error?.message === 'Unauthorized') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="mb-6">You need to be signed in to view your agents.</p>
        <Button onClick={() => router.push('/login')}>Sign In</Button>
      </div>
    );
  }

  const handleAddNewAgent = () => setIsNewAgentDialogOpen(true);

  // The backend doesn't provide meetingCount, so we augment the data on the client-side.
  const agents: Agent[] =
    result?.data?.map((agent) => ({
      ...agent,
      meetingCount: 1, // Mocking meetings per agent
    })) ?? [];

  const totalMeetings = agents.reduce(
    (acc, agent) => acc + agent.meetingCount,
    0
  );

  // The type for columns needs to be asserted to avoid TS errors with generics
  const agentColumns = columns as ColumnDef<Agent, unknown>[];

  return (
    <div className="container mx-auto py-8">
      {/* Always visible dialog */}
      <NewAgentDialog
        open={isNewAgentDialogOpen}
        onOpenChange={setIsNewAgentDialogOpen}
      />
      
      {/* Always visible header with filter */}
      <AgentListHeader
        meetingCount={totalMeetings}
        onAddNewAgent={handleAddNewAgent}
      />
      
      {/* Conditional content area */}
      {!agents.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-12 h-[350px] mt-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 mb-6">
            <svg
              className="w-10 h-10 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6.13a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">No Agents Found</h2>
          <p className="text-base text-slate-600 mb-8 max-w-xs text-center">
            Create your first agent to get started!
          </p>
          <NewAgentButton onClick={handleAddNewAgent} />
        </div>
      ) : (
        <div className="mt-6">
          <DataTable 
            data={agents} 
            columns={agentColumns}
            onRowClick={(row) => router.push(`/agents/${row.id}`)}
            />
        </div>
      )}
      
      {/* Always show pagination controls */}
      <div className="mt-6">
        <DataPagination
          page={filter.page}
          totalPages={result?.totalPages || 1}
          onPageChange={(page) => setFilter({ page })}
        />
      </div>
    </div>
  );
};


