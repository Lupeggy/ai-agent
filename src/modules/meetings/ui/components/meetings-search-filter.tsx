"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState, useEffect } from "react";

interface MeetingsSearchFilterProps {
  searchValue?: string;
  onSearch: (value: string) => void;
}

export const MeetingsSearchFilter = ({
  searchValue = "",
  onSearch,
}: MeetingsSearchFilterProps) => {
  // Use internal state to control the input value
  const [inputValue, setInputValue] = useState(searchValue);
  
  // Sync with external searchValue when it changes
  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  // Debounce search to avoid too many updates while typing
  const handleSearch = useDebouncedCallback((value: string) => {
    onSearch(value);
  }, 300);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value); // Update internal state immediately
    handleSearch(value); // Debounce the actual search
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search meetings..."
        className="pl-10 w-64"
        value={inputValue} // Use controlled input pattern
        onChange={handleInputChange}
      />
    </div>
  );
};
