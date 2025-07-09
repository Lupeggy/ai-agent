"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import JSONL from "jsonl-parse-stringify";
import Highlighter from "react-highlight-words";

// Types for transcript items
interface TranscriptItem {
  id: string;
  text: string;
  userId: string;
  timestamp: string;
  speaker: {
    id: string;
    name: string;
    image: string | null;
    isAgent: boolean;
  };
}

// Types to match JSON structure from backend
interface ServerTranscriptItem {
  id: string;
  start_ts?: number;
  end_ts?: number;
  text: string;
  speaker_id?: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  agent?: {
    id: string;
    name: string;
    image?: string;
  };
  timestamp?: string;
  created_at?: string;
  userId?: string;
  user_id?: string;
}

interface TranscriptContentProps {
  transcriptUrl: string | null;
  agentId: string;
  userName?: string;
  agentName?: string;
  isLoading?: boolean;
}

interface TranscriptViewProps {
  transcript: string | null;
  agentId: string;
  userName?: string;
  agentName?: string;
  isLoading?: boolean;
  searchQuery: string;
}

// Helper function to parse transcript text from different formats
function parseTranscript(transcript: string | null): TranscriptItem[] {
  if (!transcript) return [];

  const lines = transcript.split(/\n/);
  const items: TranscriptItem[] = [];

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Try to parse as JSON first
    try {
      if (line.trim().startsWith('{') || line.trim().startsWith('[')) {
        // Parse as JSON object or array
        const parsed = line.trim().startsWith('[') ? 
          JSON.parse(line) : [JSON.parse(line)];

        // Process each item
        for (const rawItem of parsed) {
          const item = rawItem as ServerTranscriptItem;

          if (!item) continue;
          
          // Handle text - required field
          const text = item.text ? item.text.toString() : "";
          if (!text) continue; // Skip items without text

          // Handle ID
          const id = item.id ? item.id.toString() : 
            `transcript-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          // Handle timestamp
          const timestamp = (item.created_at || item.timestamp || 
            (item.start_ts ? new Date(item.start_ts).toISOString() : null) || 
            new Date().toISOString()).toString();
          
          // Determine if this is an agent message or user message based on structure
          let userId: string;
          let speakerName: string;
          let speakerImage: string | null = null;
          let isAgent = false;
          
          // Case 1: Item has user and agent properties
          if (item.user || item.agent) {
            if (item.agent) {
              // This is an agent message
              userId = `agent-${item.agent.id || 'unknown'}`;
              speakerName = item.agent.name || "AI Assistant";
              speakerImage = item.agent.image || null;
              isAgent = true;
            } else if (item.user) {
              // This is a user message
              userId = item.user.id || 'unknown';
              speakerName = item.user.name || "You";
              speakerImage = item.user.image || null;
              isAgent = false;
            } else {
              // Default to system message if neither user nor agent
              userId = 'system';
              speakerName = 'System';
              isAgent = false;
            }
          }
          // Case 2: Item has speaker_id or user_id/userId
          else {
            const speakerId = item.speaker_id || item.user_id || item.userId || 'unknown';
            userId = speakerId.toString();
            isAgent = userId.startsWith('agent-');
            speakerName = isAgent ? "AI Assistant" : "You";
          }
          
          // Create transcript item
          items.push({
            id,
            text,
            userId,
            timestamp,
            speaker: {
              id: userId,
              name: speakerName,
              image: speakerImage,
              isAgent
            }
          });
        }
      } else if (line.includes('"text"')) {
        // Try to parse as JSONL
        try {
          const jsonlItems = JSONL.parse(line);
          
          for (const rawItem of jsonlItems) {
            const item = rawItem as ServerTranscriptItem;
            
            if (!item || !item.text) continue;
            
            // Handle required fields with fallbacks
            const text = item.text.toString();
            const id = (item.id || `jsonl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`).toString();
            const timestamp = (item.created_at || item.timestamp || 
              (item.start_ts ? new Date(item.start_ts).toISOString() : null) || 
              new Date().toISOString()).toString();
            
            // Determine speaker info
            let userId: string;
            let speakerName: string;
            let speakerImage: string | null = null;
            let isAgent = false;
            
            // Handle user/agent structure first
            if (item.user || item.agent) {
              if (item.agent) {
                // This is an agent message
                userId = `agent-${item.agent.id || 'unknown'}`;
                speakerName = item.agent.name || "AI Assistant";
                speakerImage = item.agent.image || null;
                isAgent = true;
              } else if (item.user) {
                // This is a user message
                userId = item.user.id || 'unknown';
                speakerName = item.user.name || "You";
                speakerImage = item.user.image || null;
                isAgent = false;
              } else {
                // Default to system message
                userId = 'system';
                speakerName = 'System';
                isAgent = false;
              }
            } else {
              // Fall back to user_id/userId pattern
              const speakerId = item.speaker_id || item.user_id || item.userId || 'unknown';
              userId = speakerId.toString();
              isAgent = userId.startsWith('agent-');
              speakerName = isAgent ? "AI Assistant" : "You";
            }
            
            // Create transcript item
            items.push({
              id,
              text,
              userId,
              timestamp,
              speaker: {
                id: userId,
                name: speakerName,
                image: speakerImage,
                isAgent
              }
            });
          }
        } catch (e) {
          // If JSONL parsing fails, treat as system message
          items.push({
            id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: line,
            userId: 'system',
            timestamp: new Date().toISOString(),
            speaker: {
              id: 'system',
              name: 'System',
              image: null,
              isAgent: false
            }
          });
        }
      } else {
        // Treat as plain text
        items.push({
          id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: line,
          userId: 'system',
          timestamp: new Date().toISOString(),
          speaker: {
            id: 'system',
            name: 'System',
            image: null,
            isAgent: false
          }
        });
      }
    } catch (e) {
      // If JSON parsing fails, treat as system message
      items.push({
        id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: line,
        userId: 'system',
        timestamp: new Date().toISOString(),
        speaker: {
          id: 'system',
          name: 'System',
          image: null,
          isAgent: false
        }
      });
    }
  }
  
  // Sort by timestamp if available
  return items;
}

export function TranscriptContent({
  transcriptUrl,
  agentId,
  userName = "You",
  agentName = "AI Assistant",
  isLoading
}: TranscriptContentProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  return (
    <div className="bg-white rounded-lg flex flex-col gap-y-4 w-full">
      {/* Title and Search Bar - Outside ScrollArea */}
      <div className="flex flex-col gap-y-4 mb-4">
        <p className="text-sm font-medium">Transcript</p>
        
        <div className="relative">
          <Input
            placeholder="Search Transcript"
            className="pl-7 h-9 w-full md:w-[240px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
      </div>
      
      {/* Transcript View with Scrollable Content */}
      <TranscriptView
        transcript={transcriptUrl}
        agentId={agentId}
        userName={userName}
        agentName={agentName}
        isLoading={isLoading}
        searchQuery={searchQuery}
      />
    </div>
  );
}

export function TranscriptView({ transcript, agentId, userName = "You", agentName = "AI Assistant", isLoading, searchQuery = "" }: TranscriptViewProps) {
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState<boolean>(false);
  
  // Fetch transcript if URL is provided
  useEffect(() => {
    // If transcript is not a URL, use it directly
    if (!transcript || typeof transcript !== 'string') {
      setTranscriptContent(null);
      return;
    }
    
    // Check if transcript is a URL or raw data
    const isUrl = transcript.startsWith('http://') || transcript.startsWith('https://');
    
    if (!isUrl) {
      // If it's not a URL, use it directly
      setTranscriptContent(transcript);
      return;
    }
    
    // If it's a URL, fetch the transcript
    const fetchTranscript = async () => {
      setLoadingTranscript(true);
      try {
        const response = await fetch(transcript);
        if (!response.ok) throw new Error('Failed to fetch transcript');
        const data = await response.text();
        setTranscriptContent(data);
      } catch (error) {
        console.error('Error fetching transcript:', error);
        setTranscriptContent(null);
      } finally {
        setLoadingTranscript(false);
      }
    };
    
    fetchTranscript();
  }, [transcript]);
  
  // Parse the transcript data
  const transcriptItems = useMemo(() => {
    const items = parseTranscript(transcriptContent);
    
    // Add speaker names based on props
    return items.map(item => ({
      ...item,
      speaker: {
        ...item.speaker,
        name: item.speaker.isAgent ? agentName : userName
      }
    }));
  }, [transcriptContent, userName, agentName]);

  
  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return transcriptItems;
    
    const query = searchQuery.toLowerCase();
    return transcriptItems.filter(item => 
      item.text.toLowerCase().includes(query) ||
      item.speaker.name.toLowerCase().includes(query)
    );
  }, [transcriptItems, searchQuery]);
  
  // Format timestamp for display
  function formatTime(timestamp: string) {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  if (isLoading || loadingTranscript) {
    return (
      <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
        <p className="text-sm font-medium">Loading transcript...</p>
        <div className="flex flex-col gap-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-y-2 p-4 rounded-md border animate-pulse">
              <div className="flex gap-x-2 items-center">
                <div className="size-6 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="flex flex-col gap-y-4 w-full">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No transcript available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Transcript messages in ScrollArea */}
      <ScrollArea className="max-h-[500px]">
        <div className="flex flex-col gap-y-4 p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No matching transcript found" : "No transcript available"}
              </p>
              {searchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for different keywords
                </p>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div 
                key={item.id}
                className="flex flex-col gap-y-2 hover:bg-muted p-4 rounded-md border transition-colors"
              >
                <div className="flex gap-x-2 items-center">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={
                        item.speaker.image || 
                        (item.speaker.isAgent
                          ? `/api/avatar?seed=${agentId}&variant=botttsNeutral`
                          : `/api/avatar?seed=${userName}&variant=initials`)
                      }
                      alt={`${item.speaker.name} Avatar`}
                    />
                  </Avatar>
                  <div className="flex items-center gap-x-2">
                    {searchQuery && item.speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                      <Highlighter
                        highlightClassName="bg-yellow-200 font-semibold rounded px-1"
                        searchWords={[searchQuery]}
                        autoEscape={true}
                        textToHighlight={item.speaker.name}
                        className="text-sm font-medium"
                      />
                    ) : (
                      <p className="text-sm font-medium">{item.speaker.name}</p>
                    )}
                    {item.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-sm leading-relaxed">
                  {searchQuery && item.text.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                    <Highlighter
                      highlightClassName="bg-yellow-200 font-semibold rounded px-1"
                      searchWords={[searchQuery]}
                      autoEscape={true}
                      textToHighlight={item.text}
                    />
                  ) : (
                    item.text
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {filteredItems.length > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          {filteredItems.length} of {transcriptItems.length} transcript items
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </div>
  );
}
