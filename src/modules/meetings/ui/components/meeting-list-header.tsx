"use client";

import { NewMeetingButton } from "./new-meeting-button";
import { useRouter, useSearchParams } from "next/navigation";
import { MeetingsSearchFilter } from "./meetings-search-filter";
import { AgentIdFilter } from "./agent-id-filter";
import { StatusFilter } from "./status-filter";

interface MeetingListHeaderProps {
  totalMeetings: number;
  onAddNewMeeting: () => void;
  searchValue?: string;
  agentId?: string;
  status?: string;
}

export const MeetingListHeader = ({
  totalMeetings,
  onAddNewMeeting,
  searchValue = "",
  agentId = "",
  status = "",
}: MeetingListHeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.push(`/meetings?${params.toString()}`);
  };
  
  const handleSearch = (value: string) => updateParams("search", value);
  const handleAgentChange = (value: string) => updateParams("agentId", value);
  const handleStatusChange = (value: string) => updateParams("status", value);

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-full sm:max-w-sm">
          <MeetingsSearchFilter 
            searchValue={searchValue} 
            onSearch={handleSearch} 
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-sm text-muted-foreground">
            {totalMeetings} Meeting{totalMeetings !== 1 ? "s" : ""} in total
          </div>
          <NewMeetingButton onClick={onAddNewMeeting} />
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-shrink-0">
          <AgentIdFilter 
            value={agentId} 
            onChange={handleAgentChange} 
          />
        </div>
        <div className="flex-shrink-0">
          <StatusFilter 
            value={status} 
            onChange={handleStatusChange} 
          />
        </div>
      </div>
    </div>
  );
};
