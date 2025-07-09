import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface NewMeetingButtonProps {
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export const NewMeetingButton = ({
  onClick,
  variant = "default",
  className,
}: NewMeetingButtonProps) => {
  return (
    <Button onClick={onClick} variant={variant} className={className}>
      <PlusIcon className="h-4 w-4 mr-2" />
      New Meeting
    </Button>
  );
};
