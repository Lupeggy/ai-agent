"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Video } from "lucide-react";
import { GeneratedAvatar } from "@/components/generated-avatar";

// This type defines the shape of the data for the columns.
export type Agent = {
  id: string
  name: string
  instructions: string
  createdAt: string
  updatedAt: string
  userId: string
  // The meeting count is mocked on the client-side for now.
  meetingCount: number;
}

export const columns: ColumnDef<Agent>[] = [
  {
    id: 'agentDetails',
    // We use a custom cell renderer for the entire row's content
    cell: ({ row }) => {
      const agent = row.original;

      return (
        <div className="flex items-center justify-between w-full p-4">
          <div className="flex items-center gap-4">
            <GeneratedAvatar seed={agent.name} variant="botttsNeutral" className="w-10 h-10" />
            <div>
              <div className="font-semibold text-lg">{agent.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>&#8627;</span>
                <span>{agent.instructions}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <Video className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">
              {agent.meetingCount} meeting{agent.meetingCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )
    }
  }
]