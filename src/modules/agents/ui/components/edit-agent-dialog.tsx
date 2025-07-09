import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AgentForm } from "./agent-form";
import { AgentsGetOne } from "../../types";

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentsGetOne;
}

export const EditAgentDialog = ({
  open,
  onOpenChange,
  agent,
}: EditAgentDialogProps) => {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Agent"
      description="Update the details for your agent."
    >
      <AgentForm
        initialValues={agent}
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
