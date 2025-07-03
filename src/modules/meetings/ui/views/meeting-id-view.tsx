"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { EditMeetingDialog } from "../components/edit-meeting-dialog";
import { useState, useMemo } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertCircle, Clock, Activity, CheckCircle, Loader2, XCircle, PhoneCall, Play, User, Bot, Sparkles, FileText, Video 
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompletedState, Message, parseTranscript } from "../components/completed-state";
import { MeetingView } from "@/components/meeting-view";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { MeetingStatusBadge } from "../components/meeting-status-badge";
import { format } from "date-fns";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const utils = trpc.useUtils();

  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Query to get meeting details
  const { data: meeting, isLoading, error } = trpc.meetings.getOne.useQuery({ id: meetingId });

  // Query to get agent details if we have an agentId
  const { data: agent } = trpc.agents.getOne.useQuery(
    { id: meeting?.agentId || "" },
    { enabled: !!meeting?.agentId }
  );

  // Delete meeting mutation
  const { mutate: deleteMeeting, isPending: isDeleting } = trpc.meetings.remove.useMutation({
    onSuccess: () => {
      toast.success("Meeting deleted successfully");
      router.push("/meetings");
    },
    onError: (error) => {
      toast.error(`Failed to delete meeting: ${error.message}`);
    }
  });

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!meeting) return;
    
    try {
      deleteMeeting({ id: meeting.id });
      toast.success("Meeting deleted successfully");
      router.push("/meetings");
    } catch (error) {
      toast.error("Failed to delete meeting");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Show loading state if we don't have meeting data yet
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error state if there was an error fetching the meeting
  if (error || !meeting) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-red-500">
          <AlertCircle className="h-8 w-8 mx-auto" />
        </div>
        <h3 className="text-lg font-medium">Failed to load meeting</h3>
        <p className="text-muted-foreground">{error?.message || "Meeting not found"}</p>
      </div>
    );
  }
  
  // At this point, TypeScript knows meeting is defined

  // Calculate duration text without using useMemo to avoid hook order issues
  let durationText = "Not started";
  if (meeting) {
    if (meeting.status === "upcoming") {
      durationText = "Not started";
    } else if (!meeting.startedAt) {
      durationText = "Unknown";
    } else {
      const startTime = new Date(meeting.startedAt).getTime();
      const endTime = meeting.endedAt 
        ? new Date(meeting.endedAt).getTime() 
        : meeting.status === "active" 
          ? Date.now() 
          : startTime;
      
      const durationMs = endTime - startTime;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      durationText = `${minutes}m ${seconds}s`;
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-8">
      <MeetingIdViewHeader
        meetingId={meeting.id}
        meetingName={meeting.name}
        onEdit={() => setEditDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
        isDeleting={isDeleting}
      />
      
      {/* Meeting state and controls */}
      <div className="bg-white border rounded-lg p-6 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <div className="bg-gray-100 p-2 rounded-full">
              {meeting?.status === "upcoming" && <Clock className="h-5 w-5 text-blue-500" />}
              {meeting?.status === "active" && <Activity className="h-5 w-5 text-green-500" />}
              {meeting?.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
              {meeting?.status === "processing" && <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />}
              {meeting?.status === "cancelled" && <XCircle className="h-5 w-5 text-red-500" />}
            </div>
            <div>
              <p className="text-sm font-medium capitalize">{meeting?.status}</p>
              <p className="text-xs text-muted-foreground">
                {meeting?.startedAt && (
                  <>Started {format(new Date(meeting.startedAt), "MMM d, yyyy 'at' h:mm a")}</>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {meeting?.status === "active" && (
              <Button 
                onClick={() => router.push(`/call/${meeting.id}`)}
                className="flex items-center gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                Join Call
              </Button>
            )}
            
            {meeting?.status === "upcoming" && (
              <Button 
                onClick={() => router.push(`/call/${meeting.id}`)}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Meeting
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Participant:</span>
            <span className="text-sm">You</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Agent:</span>
            <div className="flex items-center gap-1">
              {agent && (
                <>
                  <GeneratedAvatar 
                    seed={agent.id || "agent"} 
                    variant="botttsNeutral" 
                    className="w-4 h-4" 
                  />
                  <span className="text-sm">{agent.name || "Agent"}</span>
                </>
              )}
              {!agent && <span className="text-sm">Not assigned</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Duration:</span>
            <span className="text-sm">{durationText}</span>
          </div>
        </div>
      </div>
      
      {/* Traditional MeetingView for other meeting statuses */}
      {meeting?.status !== "completed" && meeting?.status !== "processing" && meeting && (
        <MeetingView
          status={meeting.status}
          onStartMeeting={() => router.push(`/call/${meeting.id}`)}
          onJoinMeeting={() => router.push(`/call/${meeting.id}`)}
          meetingDetails={{
            title: meeting.name,
            createdAt: new Date(meeting.createdAt),
            startedAt: meeting.startedAt ? new Date(meeting.startedAt) : null,
            endedAt: meeting.endedAt ? new Date(meeting.endedAt) : null
          }}
          agent={agent ? {
            id: agent.id,
            name: agent.name,
            avatarSeed: agent.id
          } : undefined}
          className="mt-4"
        />
      )}
      
      {/* Frameless horizontal tabs layout for completed and processing meetings */}
      {(meeting?.status === "completed" || meeting?.status === "processing") && meeting && (
        <div className="mt-8 border rounded-lg p-4 bg-white">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 mb-4">
              <TabsTrigger 
                value="summary" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger 
                value="transcript" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger 
                value="recording" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent"
              >
                <Video className="mr-2 h-4 w-4" />
                Recording
              </TabsTrigger>
            </TabsList>
            
            {/* Summary Tab Content */}
            <TabsContent value="summary" className="p-4 bg-gray-50 rounded-md">
              {meeting.summary ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: (props: React.HTMLProps<HTMLHeadingElement>) => (
                        <h1 className="text-2xl font-medium mb-6" {...props} />
                      ),
                      h2: (props: React.HTMLProps<HTMLHeadingElement>) => (
                        <h2 className="text-xl font-medium mb-6" {...props} />
                      ),
                      h3: (props: React.HTMLProps<HTMLHeadingElement>) => (
                        <h3 className="text-lg font-medium mb-6" {...props} />
                      ),
                      h4: (props: React.HTMLProps<HTMLHeadingElement>) => (
                        <h4 className="text-base font-medium mb-6" {...props} />
                      ),
                      ul: (props: React.HTMLProps<HTMLUListElement>) => (
                        <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />
                      ),
                      ol: ({ node, ordered, className, children, ...props }: any) => (
                        <ol className="list-decimal pl-6 mb-6 space-y-2" {...props}>
                          {children}
                        </ol>
                      ),
                      li: (props: React.HTMLProps<HTMLLIElement>) => (
                        <li className="mb-1" {...props} />
                      ),
                      p: (props: React.HTMLProps<HTMLParagraphElement>) => (
                        <p className="mb-4" {...props} />
                      ),
                      blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => (
                        <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />
                      ),
                    }}
                  >
                    {meeting.summary}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {meeting.status === "processing" ? "Summary is being processed..." : "No summary available"}
                </div>
              )}
            </TabsContent>
            
            {/* Transcript Tab Content */}
            <TabsContent value="transcript" className="p-4 bg-gray-50 rounded-md">
              {meeting.transcript ? (
                <div className="space-y-4">
                  {/* Debug info to see what's in the transcript */}
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs font-mono">Transcript length: {meeting.transcript?.length || 0} characters</p>
                    <p className="text-xs font-mono">First 100 chars: {meeting.transcript?.substring(0, 100)}</p>
                  </div>
                  
                  {/* Simple transcript display with basic formatting */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Conversation Transcript:</h3>
                    <div className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded-md border">
                      <ReactMarkdown
                        components={{
                          h1: (props: React.HTMLProps<HTMLHeadingElement>) => (
                            <h1 className="text-2xl font-medium mb-6" {...props} />
                          ),
                          h2: (props: React.HTMLProps<HTMLHeadingElement>) => (
                            <h2 className="text-xl font-medium mb-6" {...props} />
                          ),
                          h3: (props: React.HTMLProps<HTMLHeadingElement>) => (
                            <h3 className="text-lg font-medium mb-6" {...props} />
                          ),
                          h4: (props: React.HTMLProps<HTMLHeadingElement>) => (
                            <h4 className="text-base font-medium mb-6" {...props} />
                          ),
                          ul: (props: React.HTMLProps<HTMLUListElement>) => (
                            <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />
                          ),
                          ol: ({ node, ordered, className, children, ...props }: any) => (
                            <ol className="list-decimal pl-6 mb-6 space-y-2" {...props}>
                              {children}
                            </ol>
                          ),
                          li: (props: React.HTMLProps<HTMLLIElement>) => (
                            <li className="mb-1" {...props} />
                          ),
                          p: (props: React.HTMLProps<HTMLParagraphElement>) => (
                            <p className="mb-4" {...props} />
                          ),
                          blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => (
                            <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />
                          ),
                          code: ({ node, inline, className, children, ...props }: any) => (
                            inline ? 
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code> :
                              <pre className="bg-gray-100 p-4 rounded-md overflow-auto font-mono text-sm" {...props}>
                                <code>{children}</code>
                              </pre>
                          )
                        }}
                      >
                        {meeting.transcript}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Formatted messages - will try to parse the transcript */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Formatted Messages:</h3>
                    {(() => {
                      // Try to parse the transcript as JSON
                      try {
                        // Try to extract JSON objects line by line
                        const lines = meeting.transcript.split('\n');
                        const messages = [];
                        
                        // First try to find JSON objects
                        for (const line of lines) {
                          if (line.includes('"speaker_id":') && line.includes('"text":')) {
                            try {
                              // Find the JSON object in the line
                              const jsonStart = line.indexOf('{');
                              const jsonEnd = line.lastIndexOf('}');
                              
                              if (jsonStart >= 0 && jsonEnd >= 0) {
                                const jsonStr = line.substring(jsonStart, jsonEnd + 1);
                                const item = JSON.parse(jsonStr);
                                
                                if (item.speaker_id && item.text) {
                                  messages.push({
                                    isAgent: item.speaker_id === "agent" || 
                                             item.speaker_id === meeting.agentId || 
                                             (agent?.id && item.speaker_id === agent.id),
                                    content: item.text,
                                    timestamp: item.start_ts,
                                    speakerName: item.speaker_id === "agent" || 
                                                item.speaker_id === meeting.agentId || 
                                                (agent?.id && item.speaker_id === agent.id) 
                                                ? agent?.name || "Agent" : "You"
                                  });
                                }
                              }
                            } catch (err) {
                              console.error("Error parsing JSON line:", err);
                            }
                          }
                        }
                        
                        // If we found messages, display them
                        if (messages.length > 0) {
                          return messages.map((item, index) => (
                            <Message 
                              key={index}
                              isAgent={!!item.isAgent}
                              content={item.content}
                              timestamp={item.timestamp}
                              speakerName={item.speakerName}
                              agentId={meeting.agentId || ""}
                            />
                          ));
                        }
                        
                        // If no JSON objects found, try simple text parsing
                        return (
                          <div className="p-4 bg-red-50 border border-red-200 rounded">
                            <p>Could not parse transcript as JSON. Showing raw text above.</p>
                          </div>
                        );
                      } catch (e) {
                        console.error("Error parsing transcript:", e);
                        return (
                          <div className="p-4 bg-red-50 border border-red-200 rounded">
                            <p>Error parsing transcript: {String(e)}</p>
                          </div>
                        );
                      }
                    })()} 
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {meeting.status === "processing" ? "Transcript is being processed..." : "No transcript available"}
                </div>
              )}
            </TabsContent>
            
            {/* Recording Tab Content */}
            <TabsContent value="recording" className="p-4 bg-gray-50 rounded-md">
              {meeting.recordingUrl ? (
                <div className="aspect-video">
                  <video 
                    src={meeting.recordingUrl} 
                    controls 
                    className="w-full h-full rounded-md"
                    poster="/video-placeholder.png"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {meeting.status === "processing" ? "Recording is being processed..." : "No recording available"}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Edit meeting dialog */}
      <EditMeetingDialog
        meeting={meeting}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
