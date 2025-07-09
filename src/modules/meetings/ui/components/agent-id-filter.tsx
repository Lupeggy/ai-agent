"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface AgentIdFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function AgentIdFilter({ value, onChange }: AgentIdFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: agents, isLoading } = trpc.agents.getMany.useQuery({});

  // Enhanced agent filtering with multiple strategies
  const filteredAgents = useMemo(() => {
    if (!agents?.data) return [];
    if (!searchQuery.trim()) return agents.data;
    
    const query = searchQuery.toLowerCase().trim();
    
    return agents.data.filter(agent => {
      const name = agent.name.toLowerCase();
      
      // Strategy 1: Direct match - name contains query
      if (name.includes(query)) return true;
      
      // Strategy 2: Word boundary match - any word starts with query
      const words = name.split(/\s+/);
      if (words.some(word => word.startsWith(query))) return true;
      
      // Strategy 3: Fuzzy match - query characters appear in order
      let nameIndex = 0;
      for (let i = 0; i < query.length; i++) {
        const found = name.indexOf(query[i], nameIndex);
        if (found === -1) return false;
        nameIndex = found + 1;
      }
      return true;
    });
  }, [agents?.data, searchQuery]);

  const selectedAgent = agents?.data?.find(agent => agent.id === value);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[230px] justify-between"
            disabled={isLoading}
          >
            {selectedAgent ? (
              <div className="flex items-center gap-2">
                <GeneratedAvatar 
                  seed={selectedAgent.id} 
                  variant="botttsNeutral" 
                  className="w-4 h-4" 
                />
                {selectedAgent.name}
              </div>
            ) : "Filter by Agent"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[230px]" side="bottom">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search agents..." 
              className="h-9" 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>No agents found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {filteredAgents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={agent.id}
                  onSelect={() => {
                    onChange(agent.id === value ? "" : agent.id);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <GeneratedAvatar 
                      seed={agent.id} 
                      variant="botttsNeutral" 
                      className="w-4 h-4" 
                    />
                    <span className="flex-grow">{agent.name}</span>
                    {agent.id === value && <Check className="h-4 w-4" />}
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
