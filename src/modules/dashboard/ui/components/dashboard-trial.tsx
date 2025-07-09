import Link from "next/link";
import { RocketIcon } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MAX_FREE_AGENTS, MAX_FREE_MEETINGS } from "@/modules/premium/constants";

export function DashboardTrial() {
    // Use tRPC's built-in React Query hook
    const { data, isLoading, error } = trpc.premium.getFreeUsage.useQuery();

    // Show loading state
    if (isLoading) {
        return <div className="p-3 bg-blue-100 text-blue rounded-md">Loading trial data...</div>;
    }

    // Show error state
    if (error) {
        return <div className="p-3 bg-red-100 text-black rounded-md">Error loading trial data</div>;
    }

    // If no data at all
    if (!data) {
        return <div className="p-3 bg-yellow-100 text-blue rounded-md">No usage data available</div>;
    }

    // Extract counts or use defaults if not available
    const agentCount = data?.agents || 0;
    const meetingCount = data?.meetings || 0;

    return (
        <div className="border border-border/10 rounded-lg w-full bg-white/5 flex flex-col gap-y-2">
          <div className="p-3 flex flex-col gap-y-4">
            <div className="flex items-center gap-2">
              <RocketIcon className="size-4" />
              <p className="text-sm font-medium">Free Trial</p>
            </div>
            <div className="flex flex-col gap-y-2">
              <p className="text-xs">
                {agentCount}/{MAX_FREE_AGENTS} Agents
              </p>
              <Progress value={(agentCount / MAX_FREE_AGENTS) * 100} />
            </div>
            <div className="flex flex-col gap-y-2">
              <p className="text-xs">
                {meetingCount}/{MAX_FREE_MEETINGS} Meetings
              </p>
              <Progress value={(meetingCount / MAX_FREE_MEETINGS) * 100} />
            </div>
          </div>
          <Button 
            className="bg-transparent border-t border-border/10 hover:bg-white/10 rounded-t-none"
            asChild
          >
            <Link href="/upgrade">
              Upgrade
            </Link>
          </Button>
        </div>
    );
}

