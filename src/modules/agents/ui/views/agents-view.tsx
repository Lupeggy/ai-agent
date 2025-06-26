"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useRouter } from "next/navigation";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/modules/agents/ui/components/data-table";
import { columns, Agent } from "@/modules/agents/ui/components/columns";
import { AgentListHeader } from "@/modules/agents/ui/components/agent-list-header";
import { NewAgentDialog } from "../components/new-agent-dialog";
import { NewAgentButton } from "../components/new-agent-button";

export const AgentViewLoading = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg text-gray-500">Loading agents...</div>
        </div>
    );
};

export const AgentsViewError = () => {
    return (
        <ErrorState 
            title="Something went wrong"
            description="Please try again later." />
    );
};

export const AgentsView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());
  const [isNewAgentDialogOpen, setIsNewAgentDialogOpen] = React.useState(false);
  const router = useRouter();

  const handleAddNewAgent = () => setIsNewAgentDialogOpen(true);

  // The backend doesn't provide meetingCount, so we augment the data on the client-side.
  const agents: Agent[] = data?.map(agent => ({
    ...agent,
    meetingCount: 1, // Mocking 5 meetings per agent
  })) ?? [];

  const totalMeetings = agents.reduce((acc, agent) => acc + agent.meetingCount, 0);

  // The type for columns needs to be asserted to avoid TS errors with generics
  const agentColumns = columns as ColumnDef<Agent, unknown>[];

  if (!agents.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg
          className="w-16 h-16 mb-4 text-gray-300"
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
        <span className="text-xl font-medium text-gray-700 mb-2">No agents found</span>
        <span className="text-sm text-gray-500 mb-6">Create your first agent to get started!</span>
        
        <NewAgentButton onClick={handleAddNewAgent} />
      </div>
    );
  }

  return (
    <>
      <NewAgentDialog
        open={isNewAgentDialogOpen}
        onOpenChange={setIsNewAgentDialogOpen}
      />
      <div className="container mx-auto py-8">
        <AgentListHeader
          meetingCount={totalMeetings}
          onAddNewAgent={handleAddNewAgent}
        />
        <div className="mt-6">
          <DataTable data={agents} columns={agentColumns} />
        </div>
      </div>
    </>
  );
};

export default function AgentsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">My Agents</h1>
      <AgentsView />
    </div>
  );
}
