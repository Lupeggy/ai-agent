
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { DataPagination } from "@/modules/agents/ui/components/data-pagination";
import { MeetingsGetMany } from "../../types";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useState, useEffect } from "react";
import { MeetingListHeader } from "../components/meeting-list-header";
import { NewMeetingDialog } from "../components/new-meeting-dialog";
import { DataTable } from "@/modules/agents/ui/components/data-table";
import { columns } from "../components/columns";
import { ColumnDef } from "@tanstack/react-table";

// Loading state component
export const MeetingViewLoading = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col items-center w-full max-w-xs">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Meetings</h2>
        <p className="text-gray-500 text-center">Please wait while we retrieve your meetings...</p>
      </div>
    </div>
  );
};

// Error state component
export const MeetingViewError = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-xl shadow-lg border border-red-100 px-8 py-10 flex flex-col items-center w-full max-w-md">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-center mb-6">We couldn't load your meetings. Please try again later.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );
};

export const MeetingsView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const agentId = searchParams.get("agentId") || "";
  const status = searchParams.get("status") || "";
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = trpc.meetings.getMany.useQuery(
    { 
      page, 
      search, 
      agentId: agentId || undefined, 
      status: status as any || undefined,
      pageSize: 10
    },
    { throwOnError: false }
  );

  const handleAddNewMeeting = () => {
    setIsNewMeetingDialogOpen(true);
  };

  // Handle loading state
  if (isLoading) {
    return <MeetingViewLoading />;
  }

  // Handle error state
  if (isError) {
    return <MeetingViewError />;
  }
  
  const meetings = data?.data || [];
  const totalMeetings = meetings.length;
  
  // Type assertion for columns
  const meetingColumns = columns as ColumnDef<MeetingsGetMany, unknown>[];

  return (
    <div className="container mx-auto py-8">
      {/* Always visible dialog */}
      <NewMeetingDialog
        open={isNewMeetingDialogOpen}
        onOpenChange={setIsNewMeetingDialogOpen}
      />
      
      {/* Always visible header with filter */}
      <MeetingListHeader
        totalMeetings={totalMeetings}
        onAddNewMeeting={handleAddNewMeeting}
        searchValue={search}
        agentId={agentId}
        status={status}
      />
      
      {/* Conditional content area */}
      {!meetings.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-12 h-[350px] mt-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 mb-6">
            <Video className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">No meetings found!</h2>
          <p className="text-base text-slate-600 mb-8 max-w-xs text-center">
            Create your first meeting to get started!
          </p>
          <Button onClick={handleAddNewMeeting}>Create Meeting</Button>
        </div>
      ) : (
        <div className="mt-6">
          <DataTable 
            data={meetings} 
            columns={meetingColumns}
            onRowClick={(row) => router.push(`/meetings/${row.id}`)}
          />
        </div>
      )}
      
      {/* Always show pagination controls */}
      <div className="mt-6">
        <DataPagination
          page={page}
          totalPages={data?.totalPages || 1}
          onPageChange={(newPage) => {
            router.push(`/meetings?page=${newPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
          }}
        />
      </div>
    </div>
  );
};