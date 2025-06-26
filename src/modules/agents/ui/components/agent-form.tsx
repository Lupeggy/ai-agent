"use client";

import { AgentsGetOne } from "../../types";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { agentInsertSchema } from "../../schemas";

import { GeneratedAvatar } from "@/components/generated-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentsGetOne;
}

export const AgentForm = ({ onSuccess, onCancel, initialValues }: AgentFormProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async() => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions(),
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getOne.queryOptions({ id: initialValues.id }),
          )
        }
        toast.success(initialValues?.id ? "Agent updated successfully" : "Agent created successfully");
        onSuccess?.();
      },

      onError: (error) => {
        toast.error(initialValues?.id ? "Failed to update agent" : "Failed to create agent", {
          description: error.message || "Please try again later"

        //TODO: 
        });
      },
    })
  )

  // We don't need the manual isSubmitting state anymore as we can use the mutation's isPending state

  const form = useForm<z.infer<typeof agentInsertSchema>>({
    resolver: zodResolver(agentInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? ""
    }
  });

  const isEdit = !!initialValues?.id;
  const isPending = createAgent.isPending;
  
  const onSubmit = (values: z.infer<typeof agentInsertSchema>) => {
    if (isEdit) {
      console.log("TODO: Update agent");
      // Will implement update logic in the future
    } else {
      createAgent.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              {isEdit ? "Update your agent details" : "Configure your new AI assistant"}
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
              <FormDescription>
                Name of the agent
              </FormDescription>
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