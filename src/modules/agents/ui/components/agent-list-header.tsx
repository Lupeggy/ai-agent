"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewAgentDialog } from "./new-agent-dialog";
import { useState } from "react";

export const AgentListHeader = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (

    <> <NewAgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    
        <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Agents</h2>
        <Button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow"
            onClick={() => setIsDialogOpen(true)}
        >
            <Plus className="w-4 h-4" />
            Add New Agent
        </Button>
        </div>
        </>
  );
};