"use client"

import { trpc } from "@/trpc/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

import { CallProvider } from "../component/call-provider";
import { CallLobby } from "../component/call-lobby";
import { CallUI } from "../component/call-ui";

interface Props {   
    meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
    const [hasJoined, setHasJoined] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
    
    // Get authenticated session to determine admin status
    const { data: session } = authClient.useSession();
    
    // Fetch meeting data using tRPC
    const { data: meetingData } = trpc.meetings.getOne.useQuery(
        { id: meetingId },
        { enabled: !!meetingId }
    );
    
    // Convert string dates to Date objects if needed
    const meeting = meetingData ? {
        ...meetingData,
        createdAt: typeof meetingData.createdAt === 'string' ? new Date(meetingData.createdAt) : meetingData.createdAt,
        updatedAt: typeof meetingData.updatedAt === 'string' ? new Date(meetingData.updatedAt) : meetingData.updatedAt,
        startedAt: meetingData.startedAt ? (typeof meetingData.startedAt === 'string' ? new Date(meetingData.startedAt) : meetingData.startedAt) : null,
        endedAt: meetingData.endedAt ? (typeof meetingData.endedAt === 'string' ? new Date(meetingData.endedAt) : meetingData.endedAt) : null
    } : null;
    
    // Use tRPC mutation hook for updating meeting status
    const updateMeeting = trpc.meetings.update.useMutation({
        onSuccess: () => {
            toast.success("Meeting status updated");
        },
        onError: (err) => {
            toast.error(`Failed to update meeting: ${err.message}`);
        },
    });
    
    // Determine if the current user is the admin of the meeting
    const isAdmin = session?.user?.id && meeting?.userId ? session.user.id === meeting.userId : false;

    const handleJoinCall = (camera: boolean = true, microphone: boolean = true) => {
        console.log('Joining call with camera:', camera, 'microphone:', microphone);
        setCameraEnabled(camera);
        setMicrophoneEnabled(microphone);
        setHasJoined(true);

        if (meeting?.status === "upcoming" && isAdmin) {
            updateMeeting.mutate({
                id: meetingId,
                status: "active",
                startedAt: new Date().toISOString(),
            });
        }
    };
    
    const handleLeaveCall = () => {
        console.log('Leaving call');
        setHasJoined(false);
        
        // Update meeting status to completed for all users
        // Only admin can update endedAt timestamp
        updateMeeting.mutate({
            id: meetingId,
            status: "completed",
            ...(isAdmin ? { endedAt: new Date().toISOString() } : {})
        });
    };

    // Log when meeting data changes to help debug Stream.io connection
    useEffect(() => {
        if (meeting) {
            console.log("Meeting data loaded for Stream.io:", { 
                id: meeting.id,
                name: meeting.name,
                status: meeting.status,
                userId: meeting.userId
            });
        }
    }, [meeting]);

    // If meeting is cancelled or completed, show message
    if (meeting?.status === "completed" || meeting?.status === "cancelled") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8 rounded-lg bg-red-50 border border-red-100">
                    <h3 className="text-lg font-medium text-red-800">Meeting has ended or been cancelled</h3>
                    <p className="mt-2 text-sm text-red-600">You cannot join this meeting anymore.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            
            {/* Main call UI */}
            <CallProvider meetingId={meetingId} meetingName={meeting?.name || 'Video Call'}>
                {hasJoined ? (
                    <CallUI 
                        meeting={meeting} 
                        onLeaveCall={handleLeaveCall}
                        isAdmin={isAdmin}
                        initialCameraEnabled={cameraEnabled}
                        initialMicrophoneEnabled={microphoneEnabled}
                    />
                ) : (
                    <CallLobby 
                        meeting={meeting} 
                        onJoinCall={handleJoinCall}
                        isAdmin={isAdmin}
                    />
                )}
            </CallProvider>
        </div>
    );
};