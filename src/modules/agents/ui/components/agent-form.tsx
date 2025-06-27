"use client";

import { AgentsGetOne } from "../../types";

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
import { Textarea } from "@/components/ui/textarea";
import { agentInsertSchema } from "../../schemas";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentsGetOne;
}

// Form component for creating or updating an agent
export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const utils = trpc.useUtils();

  // Determine if we're editing an existing agent
  const isEdit = !!initialValues?.id;

  // Create a form with validation
  const form = useForm<z.infer<typeof agentInsertSchema>>({
    resolver: zodResolver(agentInsertSchema),
    defaultValues: {
      name: initialValues?.name || "",
      instructions: initialValues?.instructions || "",
    },
  });

  const createAgentMutation = trpc.agents.create.useMutation({
    onSuccess: async () => {
      await utils.agents.getMany.invalidate();
      toast.success("Agent created successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });

  const updateAgentMutation = trpc.agents.update.useMutation({
    onSuccess: async () => {
      await utils.agents.getMany.invalidate();
      if (initialValues?.id) {
        await utils.agents.getOne.invalidate({ id: initialValues.id });
      }
      toast.success("Agent updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });

  // Handle the form submission
  const handleSubmit = (data: z.infer<typeof agentInsertSchema>) => {
    if (isEdit) {
      updateAgentMutation.mutate({ ...data, id: initialValues.id });
    } else {
      createAgentMutation.mutate(data);
    }
  };

  const isPending =
    createAgentMutation.isPending || updateAgentMutation.isPending;

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
              {isEdit ? "Edit Agent" : "Create New Agent"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? "Update your agent details"
                : "Configure your new AI assistant"}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Agent name" {...field} />
              </FormControl>
              <FormDescription>Name of the agent</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What should this agent do?"
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed instructions for your agent
              </FormDescription>
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
            {isPending ? "Saving..." : isEdit ? "Update Agent" : "Create Agent"}
          </Button>
        </div>
      </form>
    </Form>
  );
};