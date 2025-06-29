"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { z } from "zod";
import { TRPCClientError } from "@trpc/client";
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
import { MeetingsGetMany } from "../../types";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MeetingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: MeetingsGetMany;
}

// Form component for creating or updating a meeting
export const MeetingForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: MeetingFormProps) => {
  const utils = trpc.useUtils();
  const { data: agents, isLoading: isLoadingAgents } = trpc.agents.getMany.useQuery({});
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Determine if we're editing an existing meeting
  const isEdit = !!initialValues?.id;

  // Create a form with validation
  const form = useForm<z.infer<typeof meetingInsertSchema>>({
    resolver: zodResolver(meetingInsertSchema),
    defaultValues: {
      name: initialValues?.name || "",
      agentId: initialValues?.agentId || "",
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

  const createMeetingMutation = trpc.meetings.create.useMutation({
    onSuccess: async (data) => {
      await utils.meetings.getMany.invalidate();
      toast.success("Meeting created successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create meeting: ${error.message}`);
    },
  });

  // Type error: meetings.update doesn't exist yet, uncomment when the procedure is implemented
  /*
  const updateMeetingMutation = trpc.meetings.update.useMutation({
  */
  /*  
    onSuccess: async () => {
      await utils.meetings.getMany.invalidate();
      if (initialValues?.id) {
        await utils.meetings.getOne.invalidate({ id: initialValues.id });
      }
      toast.success("Meeting updated successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update meeting: ${error.message}`);
    },
  });
  */

  // Handle the form submission
  const handleSubmit = (data: z.infer<typeof meetingInsertSchema>) => {
    if (isEdit) {
      // Update functionality not implemented yet
      // updateMeetingMutation.mutate({ ...data, id: initialValues.id });
      toast.info("Update functionality not implemented yet");
    } else {
      createMeetingMutation.mutate(data);
    }
  };

  const isPending = createMeetingMutation.isPending; // || updateMeetingMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <GeneratedAvatar
            seed={form.watch("name")}
            variant="botttsNeutral"
            className="w-12 h-12"
          />
          <div>
            <h3 className="text-lg font-medium">
              {isEdit ? "Edit Meeting" : "Create New Meeting"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? "Update your meeting details"
                : "Enter a name for your meeting and select an agent to join."}
            </p>
          </div>
        </div>

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
                      {field.value
                        ? agents?.data.find((agent) => agent.id === field.value)?.name
                        : "Select an agent to join the meeting"}
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
                            <span className={cn(
                              "mr-2",
                              field.value === agent.id ? "font-medium" : "font-normal"
                            )}>
                              {agent.name}
                            </span>
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
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? "Saving..." : isEdit ? "Update Meeting" : "Create Meeting"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
