"use client";

import { NewMeetingButton } from "./new-meeting-button";
import { useRouter, useSearchParams } from "next/navigation";
import { MeetingsSearchFilter } from "./meetings-search-filter";

interface MeetingListHeaderProps {
  totalMeetings: number;
  onAddNewMeeting: () => void;
  searchValue?: string;
}

export const MeetingListHeader = ({
  totalMeetings,
  onAddNewMeeting,
  searchValue = "",
}: MeetingListHeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    router.push(`/meetings?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
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
  );
};
