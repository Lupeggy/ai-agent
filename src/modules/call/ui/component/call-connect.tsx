"use client";

import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { generateAvatar } from "@/lib/stream-video";
import { trpc } from "@/trpc/client";

interface CallConnectProps {
  children?: ReactNode;
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage?: string;
  initialCameraEnabled?: boolean;
  initialMicrophoneEnabled?: boolean;
}

export const CallConnect = ({ 
  children, 
  meetingId, 
  meetingName,
  userId, 
  userName, 
  userImage,
  initialCameraEnabled = true,
  initialMicrophoneEnabled = true
}: CallConnectProps) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | undefined>(undefined);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<StreamVideoClient | null>(null);

  // Use tRPC client directly for token generation
  const generateTokenMutation = trpc.meetings.generateToken.useMutation();
  
  // Generate token function for Stream Video client
  const generateToken = async (userId: string) => {
    try {
      console.log('Attempting to generate token for user:', userId, 'and meeting:', meetingId);
      
      // Call the tRPC mutation directly
      const result = await generateTokenMutation.mutateAsync({ 
        userId, 
        meetingId 
      });
      
      console.log('Token generated successfully:', result);
      
      if (result && result.token) {
        return result.token;
      }
      
      console.warn('Server returned invalid token format');
      throw new Error('Invalid token format');
    } catch (error) {
      console.error('Failed to get token:', error);
      toast.error('Failed to connect to video service: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  };

  useEffect(() => {
    let isActive = true; // Flag to prevent state updates after unmount
    
    const initializeClient = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        console.log('Initializing Stream video client...');
        
        if (!userId || !userName) {
          const errorMsg = 'Missing user information';
          console.error(errorMsg);
          setError(errorMsg);
          toast.error(errorMsg);
          setIsConnecting(false);
          return;
        }
        
        // Check API key
        const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
        if (!apiKey) {
          const errorMsg = 'Missing Stream Video API key';
          console.error(errorMsg);
          setError(errorMsg);
          toast.error(errorMsg);
          setIsConnecting(false);
          return;
        }
        
        console.log('Generating token first for user:', userId, 'meeting:', meetingId);
        
        // Generate token first
        let token;
        try {
          token = await generateToken(userId);
          console.log('Token generated successfully:', token ? 'Token received' : 'No token');
          
          if (!token) {
            throw new Error('Failed to generate token');
          }
        } catch (tokenError) {
          console.error('Failed to generate token:', tokenError);
          setError('Failed to generate token: ' + (tokenError instanceof Error ? tokenError.message : 'Unknown error'));
          toast.error('Failed to generate token');
          setIsConnecting(false);
          return;
        }
        
        console.log('Creating StreamVideoClient for user:', userId, userName);
        
        // Create a Stream Video client with the token
        const _client = new StreamVideoClient({
          apiKey,
          user: {
            id: userId,
            name: userName,
            image: userImage || generateAvatar(userName)
          },
          token: token,
        });
        
        console.log('StreamVideoClient created successfully');

        try {
          // Connect the client
          console.log('Connecting Stream client...');
          // No need to call connectUser since we provided user and token in constructor
          console.log('Stream client connected successfully');
          
          if (isActive) {
            // Store the client reference
            clientRef.current = _client;
            // Update the state with the client
            setClient(_client);
            setIsConnecting(false);
          }
        } catch (connectError) {
          console.error('Failed to connect Stream client:', connectError);
          if (isActive) {
            const errorMsg = 'Failed to connect: ' + (connectError instanceof Error ? connectError.message : 'Unknown error');
            setError(errorMsg);
            toast.error(errorMsg);
            setIsConnecting(false);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Stream client:', error);
        if (isActive) {
          const errorMsg = 'Failed to connect to video service: ' + (error instanceof Error ? error.message : 'Unknown error');
          setError(errorMsg);
          toast.error(errorMsg);
          setIsConnecting(false);
        }
      }
    };
    
    initializeClient();
    
    // Clean up on unmount or when dependencies change
    return () => {
      isActive = false;
      // Use the ref to ensure we are disconnecting the correct client instance
      if (clientRef.current) {
        console.log('Disconnecting Stream client on cleanup');
        try {
          clientRef.current.disconnectUser();
        } catch (e) {
          console.error('Error disconnecting user:', e);
        }
        clientRef.current = null;
      }
    };
  }, [userId, userName, userImage]);

  // Create or join call when client is available
  useEffect(() => {
    if (!client) return;
    
    let _call: Call | undefined;
    let isActive = true;

    console.log('Client is available, attempting to create or join call');
    
    const createOrJoinCall = async () => {
      try {
        console.log('Creating or joining call with ID:', meetingId);
        
        // Set up call options with proper type
        const callType = 'default';
        const callId = meetingId;
        
        console.log(`Getting call with type: ${callType}, id: ${callId}`);
        _call = client.call(callType, callId);
        
        // Add comprehensive event listeners for debugging
        _call.on('call.updated', (event) => {
          console.log('Call updated event:', event.type, 'state:', _call?.state?.callingState);
        });
        
        _call.on('call.live_started', () => {
          console.log('Call is now live');
          toast.success('Call is now live');
        });
        
        _call.on('call.session_started', () => {
          console.log('Call session started');
        });
        
        _call.on('call.session_ended', () => {
          console.log('Call session ended');
        });
        
        // Add general error handling
        client.on('connection.error', (event) => {
          console.error('Connection error event:', event);
          toast.error(`Connection error: ${event.error || 'Unknown error'}`);
        });
        
        // Handle call-specific errors
        _call.on('call.rejected', (event) => {
          console.error('Call rejected:', event);
          toast.error('Call was rejected');
        });
        
        // We'll skip the call.get() check as it's causing errors
        // Instead, we'll try to join with create:true which will create the call if it doesn't exist
        console.log('Will attempt to join call with create option if needed');
        
        // We'll skip pre-checking permissions before joining
        // This allows users to join the call even if they deny permissions initially
        // They can enable devices later if they change their mind
        console.log('Skipping pre-join permission checks to allow joining regardless of permissions');
        
        // Join or create the call with proper settings
        console.log('Joining call with create option');
        try {
          await _call.join({
            create: true,
            data: {
              custom: {
                meetingId,
                meetingName,
              },
            },
            ring: false,
            // We'll enable audio and video separately after joining if permissions are available
          });
        } catch (joinError) {
          console.error('Error joining call:', joinError);
          toast.error('Failed to join call. Please try again.');
          throw joinError; // Re-throw to stop the process
        }
        
        // Try to enable camera and microphone after joining, but don't block call if they fail
        // This allows users to join calls even without media permissions
        
        // Try to enable camera if the user wants it on
        if (initialCameraEnabled) {
          try {
            console.log('Attempting to enable camera...');
            await _call.camera.enable();
            console.log('Camera enabled successfully');
          } catch (cameraError) {
            console.warn('Could not enable camera initially:', cameraError);
            // Don't show error toast here - user can try again with the toggle button
          }
        } else {
          console.log('Camera initially disabled by user preference');
        }
        
        // Try to enable microphone if the user wants it on
        if (initialMicrophoneEnabled) {
          try {
            console.log('Attempting to enable microphone...');
            await _call.microphone.enable();
            console.log('Microphone enabled successfully');
          } catch (micError) {
            console.warn('Could not enable microphone initially:', micError);
            // Don't show error toast here - user can try again with the toggle button
          }
        } else {
          console.log('Microphone initially disabled by user preference');
        }
        
        console.log('Call created and joined successfully');
        
        if (isActive) {
          setCall(_call);
        }
      } catch (error) {
        console.error('Failed to create or join call:', error);
        toast.error('Failed to join meeting room: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    createOrJoinCall();

    return () => {
      isActive = false;
      
      // Use the local _call reference to ensure we're leaving the correct call
      if (_call && _call.state.callingState !== CallingState.LEFT) {
        console.log('Leaving call on cleanup');
        try {
          _call.leave();
        } catch (e) {
          console.error('Error leaving call:', e);
        }
      }
    };
  }, [client, meetingId]);

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1f2c]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="text-lg text-white">Connecting to video call...</p>
        </div>
      </div>
    );
  }
  
  // Ensure client is defined before rendering StreamVideo
  if (!client || error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1f2c]">
        <div className="text-center p-6 max-w-md mx-auto border border-gray-700 rounded-lg shadow-md bg-[#252a37] text-white">
          <h2 className="text-xl font-bold mb-2 text-white">Connection Error</h2>
          <p className="mb-4 text-gray-300">{error || 'Unable to connect to video service. Please try again.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          <div className="mt-4 text-sm text-gray-400">
            <p>Debug info:</p>
            <p>API Key present: {process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY ? 'Yes' : 'No'}</p>
            <p>User ID: {userId ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Only render children when call is ready
  if (!call) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1f2c]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="text-lg text-white">Preparing meeting room...</p>
        </div>
      </div>
    );
  }
  
  console.log('Rendering StreamVideo with call:', call.id, 'state:', call.state.callingState);
  
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        {children}
      </StreamCall>
    </StreamVideo>
  );
};
