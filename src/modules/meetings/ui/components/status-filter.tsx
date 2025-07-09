"use client";

import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { MeetingStatusBadge } from "./meeting-status-badge";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "cancelled", label: "Cancelled" },
];

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const [open, setOpen] = useState(false);

  // Get the selected status option
  const selectedStatus = statusOptions.find((status) => status.value === value);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] justify-between"
          >
            {selectedStatus ? (
              <MeetingStatusBadge status={selectedStatus.value} />
            ) : (
              "Filter by Status"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[180px]">
          <Command>
            <CommandInput placeholder="Search status..." />
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {statusOptions.map((status) => (
                <CommandItem
                  key={status.value}
                  value={status.value}
                  onSelect={() => {
                    onChange(status.value === value ? "" : status.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <MeetingStatusBadge status={status.value} />
                    {status.value === value && <Check className="h-4 w-4 ml-2" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
