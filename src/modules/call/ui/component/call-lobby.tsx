"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { meeting } from "@/db/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { generateAvatar } from "@/lib/stream-video";
import type { InferSelectModel } from "drizzle-orm";
import { Mic, MicOff, Video, VideoOff, ArrowRight } from "lucide-react";

// Toggle button for camera and microphone
const ToggleButton = ({ 
  active, 
  onClick, 
  activeIcon, 
  inactiveIcon,
  label
}: {
  active: boolean;
  onClick: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  label?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center rounded-full w-12 h-12 ${active ? 'bg-red-500 text-white' : 'bg-red-500 text-white'} hover:opacity-90 transition-opacity shadow-md`}
    aria-label={label}
  >
    {active ? activeIcon : inactiveIcon}
  </button>
);

interface CallLobbyProps {
  meeting: InferSelectModel<typeof meeting> | null;
  onJoinCall: (cameraEnabled: boolean, microphoneEnabled: boolean) => void;
  isAdmin: boolean;
}

export const CallLobby = ({ meeting, onJoinCall, isAdmin }: CallLobbyProps) => {
  const { data: session } = authClient.useSession();
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [userName, setUserName] = useState(session?.user?.name || "");
  const userImage = generateAvatar(userName);

  const handleJoinMeeting = useCallback(() => {
    // Validate username if needed
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }
    
    onJoinCall(cameraEnabled, microphoneEnabled);
  }, [userName, onJoinCall, cameraEnabled, microphoneEnabled]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <Card className="w-full max-w-md md:max-w-lg mx-4 shadow-xl border-0 bg-[#f8f9fa] text-black rounded-lg overflow-hidden">
        <CardHeader className="text-center pb-2 pt-4 bg-[#ebeef2]">
          <CardTitle className="text-2xl md:text-3xl text-black">{"Ready to join?"}</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Set up your call before joining {meeting?.name ? `with ${meeting.name}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          {/* Large centered avatar */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-full h-56 sm:h-64 rounded-md overflow-hidden bg-[#111827] flex items-center justify-center mb-4 border border-gray-300">
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                <AvatarImage src={userImage} alt={userName} className="w-full h-full object-cover" />
                <AvatarFallback className="text-4xl bg-purple-600 text-white w-full h-full flex items-center justify-center">
                  {userName.substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Hidden name input - we'll use the session name */}
            <Input
              type="hidden"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          {/* Device toggle buttons */}
          <div className="flex items-center justify-center space-x-6 mt-4 mb-2">
            <ToggleButton
              active={microphoneEnabled}
              onClick={() => setMicrophoneEnabled(!microphoneEnabled)}
              activeIcon={<Mic size={24} />}
              inactiveIcon={<MicOff size={24} />}
              label="Toggle microphone"
            />
            <ToggleButton
              active={cameraEnabled}
              onClick={() => setCameraEnabled(!cameraEnabled)}
              activeIcon={<Video size={24} />}
              inactiveIcon={<VideoOff size={24} />}
              label="Toggle camera"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-4 pb-6 px-6 border-t border-gray-200 bg-[#ebeef2]">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="px-5 py-2.5 bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleJoinMeeting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md flex items-center gap-2 shadow-md font-medium"
          >
            <span>Join Call</span>
            <ArrowRight size={16} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
