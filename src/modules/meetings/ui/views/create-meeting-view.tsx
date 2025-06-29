"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { meetingInsertSchema } from "../../schemas";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CreateMeetingView = () => {
  const router = useRouter();
  const { data: agents, isLoading: isLoadingAgents } = trpc.agents.getMany.useQuery({});

  const form = useForm<z.infer<typeof meetingInsertSchema>>({
    resolver: zodResolver(meetingInsertSchema),
    defaultValues: {
      name: "",
      agentId: "",
    },
  });

  const createMeetingMutation = trpc.meetings.create.useMutation({
    onSuccess: (data) => {
      toast.success("Meeting created successfully!");
      router.push(`/meetings/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create meeting: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof meetingInsertSchema>) => {
    createMeetingMutation.mutate(values);
  };

  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Meeting</h1>
        <p className="text-muted-foreground mb-8">Enter a name for your meeting and select an agent to join.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Name</FormLabel>
                <FormControl>
                  <Input placeholder="My awesome meeting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Agent</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingAgents}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent to join the meeting" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agents?.data.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={createMeetingMutation.isPending}>
            {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
