"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewAgentButtonProps {
  onClick: () => void;
}

export const NewAgentButton = ({ onClick }: NewAgentButtonProps) => {
  return (
    <Button
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow"
      onClick={onClick}
    >
      <Plus className="w-4 h-4" />
      New Agent
    </Button>
  );
};
