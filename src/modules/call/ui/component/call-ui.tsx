"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useCall, useCallStateHooks, ParticipantView } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Mic, MicOff, Video, VideoOff, MonitorSmartphone, MessageSquare, Users, PhoneOff, CircleDot, Square, Smile, Subtitles, MoreVertical } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

// Define the meeting type to match what's being passed from call-view.tsx
interface Meeting {
  id: string;
  name: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  agentId: string;
  status: "upcoming" | "active" | "completed" | "processing" | "cancelled";
  startedAt: Date | string | null;
  endedAt: Date | string | null;
  transcript: string | null;
  recordingUrl: string | null;
  summary: string | null;
}

interface CallUIProps {
  meeting: Meeting | null;
  onLeaveCall: () => void;
  isAdmin: boolean;
  initialCameraEnabled?: boolean;
  initialMicrophoneEnabled?: boolean;
}


export const CallUI = ({ 
  meeting, 
  onLeaveCall, 
  isAdmin, 
  initialCameraEnabled = true,
  initialMicrophoneEnabled = true 
}: CallUIProps) => {
  // Get the Stream call object from the context
  const call = useCall();
  const { useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  
  // Log meeting data to help debug AI agent integration
  useEffect(() => {
    if (meeting) {
      console.log("Meeting data loaded for Stream.io:", { 
        id: meeting.id,
        name: meeting.name,
        status: meeting.status,
        userId: meeting.userId,
        agentId: meeting.agentId // Log the agentId to verify it exists
      });
      
      // Check if the meeting has an associated agent
      if (meeting.agentId) {
        console.log("Meeting has an associated AI agent with ID:", meeting.agentId);
      } else {
        console.warn("Meeting does not have an associated AI agent! This is likely why the agent isn't joining.");
      }
    }
  }, [meeting]);

  if (!call) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-2">Call Connection Error</h2>
          <p className="mb-4">Unable to connect to the call. Please try again.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  const [micEnabled, setMicEnabled] = useState(initialMicrophoneEnabled);
  const [cameraEnabled, setCameraEnabled] = useState(initialCameraEnabled);
  const [shareScreen, setShareScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Handle toggle mic
  const toggleMic = async () => {
    if (!call) return;
    
    try {
      if (micEnabled) {
        // Disable microphone
        console.log('Disabling microphone...');
        await call.microphone.disable();
        setMicEnabled(false);
        console.log('Microphone disabled successfully');
      } else {
        // Enable microphone
        console.log('Enabling microphone...');
        
        // Check browser permissions first
        if (navigator.permissions && navigator.permissions.query) {
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (micPermission.state === 'denied') {
            console.error('Microphone permission denied by browser');
            toast.error('Microphone permission denied. Please enable it in your browser settings.');
            return;
          }
        }
        
        // Get user media to ensure we have permission
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Successfully got user media stream');
        } catch (err) {
          console.error('Could not get microphone permission:', err);
          toast.error('Could not access microphone. Please check your browser settings.');
          return;
        }
        
        // Now enable the microphone in the call
        try {
          await call.microphone.enable();
          setMicEnabled(true);
          console.log('Microphone enabled successfully in call');
          
          // Clean up the temporary stream we created for permission check
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        } catch (err) {
          console.error('Error enabling microphone in call:', err);
          toast.error('Failed to enable microphone in the call');
          
          // Clean up the temporary stream on error
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      }
    } catch (error) {
      console.error('Toggle mic error:', error);
      toast.error('Failed to toggle microphone');
    }
  };

  // Handle toggle camera
  const toggleCamera = async () => {
    if (!call) return;
    
    try {
      if (cameraEnabled) {
        await call.camera.disable();
        setCameraEnabled(false);
      } else {
        try {
          // First check if we can get permission
          if (navigator.permissions && navigator.permissions.query) {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            if (cameraPermission.state === 'denied') {
              toast.error('Camera permission denied. Please enable it in your browser settings.');
              return;
            }
          }
          
          // Try to get camera permission if needed
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            
            // Now enable the camera in the call
            await call.camera.enable();
            setCameraEnabled(true);
          } catch (err) {
            console.error('Could not get camera permission:', err);
            toast.error('Could not access camera. Please check your browser settings.');
          }
        } catch (err) {
          console.error('Error enabling camera:', err);
          toast.error('Failed to enable camera');
        }
      }
    } catch (error) {
      console.error('Toggle camera error:', error);
      toast.error('Failed to toggle camera');
    }
  };

  // Handle screen share
  const toggleScreenShare = async () => {
    if (!call) return;
    
    try {
      if (shareScreen) {
        // Disable screen sharing
        if (call.screenShare) {
          await call.screenShare.disable();
        }
        setShareScreen(false);
      } else {
        // Enable screen sharing
        if (call.screenShare) {
          await call.screenShare.enable();
        }
        setShareScreen(true);
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Failed to toggle screen sharing');
    }
  };

  // Handle recording
  const toggleRecording = async () => {
    if (!call) return;
    
    try {
      if (isRecording) {
        // Check if recording is supported
        if (typeof call.stopRecording === 'function') {
          await call.stopRecording();
          setIsRecording(false);
          toast.success('Recording stopped');
        } else {
          // Fallback for demo purposes
          setIsRecording(false);
          toast.success('Recording stopped (demo)');
        }
      } else {
        // Check if recording is supported
        if (typeof call.startRecording === 'function') {
          await call.startRecording();
          setIsRecording(true);
          toast.success('Recording started');
        } else {
          // Fallback for demo purposes
          setIsRecording(true);
          toast.success('Recording started (demo)');
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Failed to toggle recording');
    }
  };

  // Toggle subtitles
  const toggleSubtitles = () => {
    const newState = !showSubtitles;
    setShowSubtitles(newState);
    toast.success(newState ? 'Subtitles enabled' : 'Subtitles disabled');
    
    // Here you would integrate with actual subtitle/transcription service
    // This is just a UI demonstration
  };

  // Send emoji reaction
  const sendEmoji = (emoji: string) => {
    if (!call) return;
    
    try {
      // Check if reaction API is supported
      if (typeof call.sendReaction === 'function') {
        // Send reaction using Stream's API
        call.sendReaction({
          type: 'emoji',
          emoji_code: emoji
        });
      }
      
      // Always show feedback to user
      toast.success(`Sent ${emoji} reaction`);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Emoji reaction error:', error);
      toast.error('Failed to send reaction');
    }
  };

  // Open leave confirmation dialog
  const openLeaveConfirmation = () => {
    setShowLeaveConfirmation(true);
  };

  // Handle leave call
  const handleLeaveCall = async () => {
    try {
      // Close the dialog
      setShowLeaveConfirmation(false);
      
      // Show recording notification
      toast.info("Meeting conversation and script will be recorded");
      
      // Leave the call
      if (call) {
        await call.leave();
      }
      
      // Notify the parent component to update meeting status to completed
      onLeaveCall();
      
      // Wait briefly for the meeting status to be updated
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirect back to meeting view
      if (meeting?.id) {
        window.location.href = `/meetings/${meeting.id}`;
      }
    } catch (error) {
      console.error("Error leaving call:", error);
      toast.error("There was an error leaving the call");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#111622] relative overflow-hidden">
      {/* Header with title and options */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <div className="text-white font-medium">
          {meeting?.name || 'Video Call'}
        </div>
        <button className="text-white p-2 rounded-full hover:bg-white/10">
          <MoreVertical size={20} />
        </button>
      </div>
      
      {/* Main content area with AI agent on top and user at bottom */}
      <div className="flex-1 flex flex-col h-full justify-center items-center py-6">
        {/* AI Agent - Large display on top */}
        <div className="w-[100%] max-w-4xl h-[520px] aspect-video mb-6 border border-gray-400/30 bg-[#212a3e] rounded-xl overflow-hidden relative">
          {remoteParticipants.length > 0 ? (
            <div className="w-full h-full">
              {remoteParticipants.map((participant) => (
                <div key={participant.sessionId} className="w-full h-full">
                  <ParticipantView participant={participant} />
                  
                  {/* AI Agent name overlay */}
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{participant.name || 'AI Agent'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-800">
              {/* AI Agent avatar when not connected */}
              <div className="w-32 h-32 rounded-full bg-red-500 flex items-center justify-center text-white text-4xl font-semibold mb-4">
                AI
              </div>
              <div className="text-white/80 text-lg">
                AI Agent not connected
              </div>
            </div>
          )}
        </div>
        
        {/* User video - Small display at bottom */}
        <div className="w-[30%] max-w-xs h-[200px] border border-gray-400/30 rounded-xl overflow-hidden relative">
          {localParticipant && (
            <div className="absolute inset-0">
              {cameraEnabled ? (
                <div className="w-full h-full">
                  <ParticipantView participant={localParticipant} />
                  
                  {/* User name overlay */}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span>{localParticipant.name || 'You'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-800">
                  <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-semibold">
                    {localParticipant?.name?.[0]?.toUpperCase() || 'Y'}
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    {localParticipant?.name || 'You'} (Camera off)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mute notification */}
      {!micEnabled && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-20">
          <div className="bg-gray-500/65 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <MicOff size={16} />
            <span>You are muted. Unmute to speak.</span>
          </div>
        </div>
      )}
      
      {/* Call controls - Centered and aligned with device */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-2 z-10">
        <div className="w-[90%] max-w-4xl mx-auto">
          <div className="bg-black rounded-full flex items-center justify-evenly px-6 py-3 shadow-lg">
            {/* Mic toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMic}
              className={!micEnabled ? "bg-red-600 text-white hover:bg-red-700 rounded-full" : "text-white hover:bg-gray-800 rounded-full"}
            >
              {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>
            
            {/* Camera toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCamera}
              className={!cameraEnabled ? "bg-red-600 text-white hover:bg-red-700 rounded-full" : "text-white hover:bg-gray-800 rounded-full"}
            >
              {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>
            
            {/* Emoji reactions */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={showEmojiPicker ? "bg-gray-700 text-white rounded-full" : "text-white hover:bg-gray-800 rounded-full"}
              >
                <Smile size={20} />
              </Button>
              
              {/* Simple emoji picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 bg-gray-800 rounded-lg shadow-lg p-2 flex space-x-2">
                  {['👍', '👏', '❤️', '😂', '😮'].map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => sendEmoji(emoji)}
                      className="text-xl hover:bg-gray-700 w-8 h-8 flex items-center justify-center rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Screen share */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleScreenShare}
              className={shareScreen ? "bg-gray-700 text-white rounded-full" : "text-white hover:bg-gray-800 rounded-full"}
            >
              <MonitorSmartphone size={20} />
            </Button>
            
            {/* Recording */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleRecording}
              className={isRecording ? "bg-red-600 text-white hover:bg-red-700 rounded-full" : "text-white hover:bg-gray-800 rounded-full"}
            >
              {isRecording ? <Square size={20} /> : <CircleDot size={20} className="text-red-500" />}
            </Button>
            
            {/* End call button */}
            <Button 
              variant="destructive" 
              onClick={openLeaveConfirmation}
              className="rounded-md px-4"
            >
              <PhoneOff size={18} className="mr-1" />
              <span>End Call</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Leave confirmation dialog */}
      <Dialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this meeting? The conversation and script will be recorded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-between sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowLeaveConfirmation(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLeaveCall}
            >
              Yes, Leave Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
