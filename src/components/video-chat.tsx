"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2 } from "lucide-react";

interface VideoChatProps {
  roomUrl: string;
  token?: string;
  userName?: string;
  onLeave?: () => void;
}

export function VideoChat({ roomUrl, token, userName, onLeave }: VideoChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeCall = useCallback(async () => {
    if (!containerRef.current || callRef.current) return;

    try {
      const call = DailyIframe.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: false,
      });

      callRef.current = call;

      call.on("joined-meeting", () => {
        setIsJoined(true);
      });

      call.on("left-meeting", () => {
        setIsJoined(false);
        if (onLeave) onLeave();
      });

      call.on("error", (e) => {
        setError(e.errorMsg || "An error occurred");
      });

      // Join the room
      await call.join({
        url: roomUrl,
        token,
        userName,
      });

      // Attach video frames to container
      const iframe = call.iframe();
      if (iframe && containerRef.current) {
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        containerRef.current.appendChild(iframe);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join call");
    }
  }, [roomUrl, token, userName, onLeave]);

  useEffect(() => {
    initializeCall();

    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
        callRef.current = null;
      }
    };
  }, [initializeCall]);

  const toggleAudio = async () => {
    if (callRef.current) {
      await callRef.current.setLocalAudio(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = async () => {
    if (callRef.current) {
      await callRef.current.setLocalVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const leaveCall = async () => {
    if (callRef.current) {
      await callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    if (onLeave) onLeave();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden transition-all ${
        isExpanded ? "fixed inset-4 z-50" : "h-[300px]"
      }`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-full px-4 py-2">
        <Button
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="icon"
          onClick={toggleAudio}
          title={isAudioEnabled ? "Mute" : "Unmute"}
        >
          {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>

        <Button
          variant={isVideoEnabled ? "secondary" : "destructive"}
          size="icon"
          onClick={toggleVideo}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Minimize" : "Expand"}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          onClick={leaveCall}
          title="Leave call"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>

      {!isJoined && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-pulse">Connecting...</div>
        </div>
      )}
    </div>
  );
}
