"use client";

import { NewAgentButton } from "./new-agent-button";
import { useAgentsFilter } from "../../hooks/use-agents-filter";
import { AgentsSearchFilter } from "./agents-search-filter";

interface AgentListHeaderProps {
  meetingCount: number;
  onAddNewAgent: () => void;
}

export const AgentListHeader = ({
  meetingCount,
  onAddNewAgent,
}: AgentListHeaderProps) => {
  const [filter, setFilter] = useAgentsFilter();

  return (
    <div className="flex items-center justify-between">
      <AgentsSearchFilter filter={filter} setFilter={setFilter} />
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {meetingCount} Meeting{meetingCount !== 1 ? "s" : ""} in total
        </div>
        <NewAgentButton onClick={onAddNewAgent} />
      </div>
    </div>
  );
};