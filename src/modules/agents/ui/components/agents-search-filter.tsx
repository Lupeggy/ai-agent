"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAgentsFilter } from "../../hooks/use-agents-filter";
import { useDebouncedCallback } from "use-debounce";

type FilterProps = ReturnType<typeof useAgentsFilter>;

interface AgentsSearchFilterProps {
  filter: FilterProps[0];
  setFilter: FilterProps[1];
}

export const AgentsSearchFilter = ({
  filter,
  setFilter,
}: AgentsSearchFilterProps) => {
  const handleSearch = useDebouncedCallback((value: string) => {
    setFilter({ search: value, page: 1 });
  }, 300);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search agents..."
        className="pl-10 w-64"
        defaultValue={filter.search ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
};
