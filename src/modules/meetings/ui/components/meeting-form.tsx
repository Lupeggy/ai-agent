"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { meetingInsertSchema } from "../../schemas";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useState, useMemo } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MeetingStatusBadge } from "./meeting-status-badge";

interface MeetingFormProps {
  onSubmit?: (values: any) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: {
    id?: string;
    name?: string;
    agentId?: string;
    status?: string;
  };
}

// Form component for creating or updating a meeting
export const MeetingForm = ({
  onSubmit,
  onCancel,
  onSuccess,
  isSubmitting = false,
  submitLabel = "Create Meeting",
  defaultValues = {},
}: MeetingFormProps) => {
  const utils = trpc.useUtils();
  const { data: agents, isLoading: isLoadingAgents } = trpc.agents.getMany.useQuery({});
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  
  // Create a form with validation
  const form = useForm<z.infer<typeof meetingInsertSchema>>({
    resolver: zodResolver(meetingInsertSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      agentId: defaultValues?.agentId || "",
    },
  });
  
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
        // Find this character in remaining part of name
        const found = name.indexOf(query[i], nameIndex);
        if (found === -1) return false; // Character not found
        nameIndex = found + 1; // Start looking after this character
      }
      return true; // All characters found in order
    });
  }, [agents?.data, searchQuery]);
  

  
  // Create meeting mutation
  const { mutate: createMeeting, isPending: isCreating } = trpc.meetings.create.useMutation({
    onSuccess: (data) => {
      toast.success("Meeting created successfully");
      utils.meetings.getMany.invalidate();
      // Use the onSuccess prop if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to create meeting: ${error.message}`);
    }
  });
  
  // Handle form submission
  const handleFormSubmit = async (data: z.infer<typeof meetingInsertSchema>) => {
    if (onSubmit) {
      onSubmit(data);
    } else {
      // If no onSubmit is provided, use the createMeeting mutation
      createMeeting(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Meeting Name</FormLabel>
              <FormControl>
                <Input placeholder="My awesome meeting" {...field} />
              </FormControl>
              <FormDescription>A name to identify this meeting</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Select Agent</FormLabel>
              <FormControl>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                      disabled={isLoadingAgents}
                    >
                      {field.value ? (
                        <div className="flex items-center gap-2">
                          <GeneratedAvatar 
                            seed={field.value} 
                            variant="botttsNeutral" 
                            className="w-4 h-4" 
                          />
                          {agents?.data.find((agent) => agent.id === field.value)?.name}
                        </div>
                      ) : "Select an agent to join the meeting"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" side="bottom">
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
                              field.onChange(agent.id);
                              setOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <GeneratedAvatar 
                                seed={agent.id} 
                                variant="botttsNeutral" 
                                className="w-4 h-4" 
                              />
                              <span className={cn(
                                field.value === agent.id ? "font-medium" : "font-normal"
                              )}>
                                {agent.name}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormDescription>Choose which AI agent will attend this meeting</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        


        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isCreating || !form.formState.isDirty}
          >
            {isSubmitting || isCreating ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
