"use client";

import { NewAgentButton } from "./new-agent-button";

export interface AgentListHeaderProps {
  meetingCount: number;
  onAddNewAgent: () => void;
}

export const AgentListHeader = ({
  meetingCount,
  onAddNewAgent,
}: AgentListHeaderProps) => {
  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {meetingCount} Meeting{meetingCount !== 1 ? 's' : ''} in total
        </div>
        <NewAgentButton onClick={onAddNewAgent} />
      </div>
    </div>
  );
};