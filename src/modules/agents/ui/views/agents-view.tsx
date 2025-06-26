"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useRouter } from "next/navigation";
import React from "react";

type Agent = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  instructions: string;
};

export const AgentViewLoading = () => {
    return (
        <LoadingState 
            title="Loading agents..." 
            description="Please wait while we load your agents." />
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
  const router = useRouter();
  const [showDialog, setShowDialog] = React.useState(true);

  const agents: Agent[] = data ?? [];

  if (!agents.length) {
    if (showDialog) {
      return (
        <ResponsiveDialog
          open
          onOpenChange={() => setShowDialog(false)}
          title="No agents found"
          description="Create your first agent to get started!"
        >
          <div className="flex items-center gap-2 mb-6">
            <Link href="/dashboard" className="flex items-center text-blue-600 hover:underline">
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6.13a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-lg">No agents found.</span>
            <span className="text-sm mt-1">Create your first agent to get started!</span>
          </div>
          <div className="flex justify-center mt-6">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium">
              Create my first agent
            </Button>
          </div>
        </ResponsiveDialog>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6.13a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <span className="text-xl font-medium text-gray-700 mb-2">No agents found</span>
          <span className="text-sm text-gray-500 mb-6">Create your first agent to get started!</span>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium">
            Create my first agent
          </Button>
        </div>
      );
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow border">
        <thead>
          <tr className="bg-blue-50">
            <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Instructions</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Updated</th>
            {/* Add more headers as needed */}
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} className="border-b hover:bg-blue-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{agent.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700 max-w-xs truncate">{agent.instructions}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(agent.createdAt).toLocaleDateString('en-GB')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(agent.updatedAt).toLocaleDateString('en-GB')}</td>
              {/* Add more cells as needed */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
