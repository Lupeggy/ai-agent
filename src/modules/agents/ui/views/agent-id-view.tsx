"use client";

import { trpc } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AgentIdViewHeader } from "../components/agent-id-view-header";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";
import { EditAgentDialog } from "../components/edit-agent-dialog";

interface Props {
    agentId: string;
};

export const AgentIdView = ({ agentId }: Props) => {
    const router = useRouter();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [data] = trpc.agents.getOne.useSuspenseQuery({ id: agentId });

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Are you sure?",
        `This will permanently delete the agent and ${data.meetingCount} associated meetings.`
    );

    const { mutate: removeAgent, isPending } = trpc.agents.remove.useMutation({
        onSuccess: () => {
            toast.success("Agent removed successfully.");
            router.push("/agents");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleRemoveAgent = async () => {
        const confirmed = await confirmRemove();
        if (!confirmed) return;
        removeAgent({ id: agentId });
    }

    return (
        <div className="flex flex-col h-screen">
            <RemoveConfirmation />
            <EditAgentDialog 
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                agent={data}
            />
            <AgentIdViewHeader
                agentId={agentId}
                agentName={data.name}
                onEdit={() => setIsEditDialogOpen(true)}
                onDelete={handleRemoveAgent}
                isDeleting={isPending}
            />
            <div className="bg-white rounded-lg border">
                <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
                    <div className="flex items-center gap-x-4">
                        <GeneratedAvatar
                            variant="botttsNeutral"
                            seed={data.name}
                            className="h-14 w-14"
                        />
                        <h2 className="text-2xl font-semibold">{data.name}</h2>
                    </div>

                    <div className="space-y-6">
                        <Badge variant="outline" className="flex items-center w-fit text-sm py-1 px-3">
                            <VideoIcon className="text-blue-700 mr-2 h-4 w-4" />
                            {data.meetingCount ?? 0} {data.meetingCount === 1 ? "Meeting" : "Meetings"}
                        </Badge>

                        <div>
                            <h3 className="text-lg font-semibold">Instructions</h3>
                            <p className="mt-2 text-medium text-muted-foreground">{data.instructions}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const AgentIdViewLoading = () => {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col items-center w-full max-w-xs">
                <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Agent Details</h2>
                <p className="text-gray-500 text-center">Please wait while we retrieve your agent details...</p>
            </div>
        </div>
    );
};

export const AgentIdViewError = () => {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-xl shadow-lg border border-red-100 px-8 py-10 flex flex-col items-center w-full max-w-md">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Couldn't Load Agent</h2>
                <p className="text-gray-500 text-center mb-6">We couldn't load this agent's details. Please try again later.</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Try Again
                </button>
            </div>
        </div>
    );
};
