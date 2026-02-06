"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { VideoChat } from "@/components/video-chat";

// Dynamically import CodeEditor with SSR disabled (monaco requires window)
const CodeEditor = dynamic(
  () => import("@/components/code-editor").then((mod) => mod.CodeEditor),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div> }
);
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LANGUAGE_NAMES } from "@/lib/judge0";
import { formatDateTime, getDifficultyColor } from "@/lib/utils";
import {
  Play,
  Clock,
  Loader2,
  Video,
  VideoOff,
  MessageSquare,
  FileCode,
  Users,
} from "lucide-react";

interface Interview {
  id: string;
  hostId: string;
  guestId: string | null;
  status: string;
  scheduledAt: string;
  roomUrl: string | null;
  notes: string | null;
  sharedCode: string | null;
  host: { id: string; name: string; image: string | null };
  guest: { id: string; name: string; image: string | null } | null;
  problem: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    topics: string[];
    starterCode: { language: string; code: string }[];
  } | null;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
}

export default function InterviewRoomPage() {
  const params = useParams();
  const interviewId = params.id as string;
  const { data: session } = useSession();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start coding here...\n");
  const [notes, setNotes] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");

  const fetchInterview = useCallback(async () => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`);
      if (res.ok) {
        const data = await res.json();
        setInterview(data);
        if (data.sharedCode) {
          setCode(data.sharedCode);
        }
        if (data.notes) {
          setNotes(data.notes);
        }
        if (data.problem) {
          setSelectedProblemId(data.problem.id);
          const starter = data.problem.starterCode.find(
            (s: { language: string }) => s.language === language
          );
          if (starter && !data.sharedCode) {
            setCode(starter.code);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch interview:", error);
    } finally {
      setLoading(false);
    }
  }, [interviewId, language]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  useEffect(() => {
    async function fetchProblems() {
      try {
        const res = await fetch("/api/problems");
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
        }
      } catch (error) {
        console.error("Failed to fetch problems:", error);
      }
    }
    fetchProblems();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartInterview = async () => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}/start`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setInterview((prev) => (prev ? { ...prev, ...data } : null));
        setIsTimerRunning(true);
        setShowVideo(true);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
    }
  };

  const handleEndInterview = async () => {
    try {
      await fetch(`/api/interviews/${interviewId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharedCode: code, notes }),
      });
      setIsTimerRunning(false);
      setShowVideo(false);
      fetchInterview();
    } catch (error) {
      console.error("Failed to end interview:", error);
    }
  };

  const handleSelectProblem = async (problemId: string) => {
    setSelectedProblemId(problemId);
    try {
      await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      fetchInterview();
    } catch (error) {
      console.error("Failed to update problem:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Interview not found</p>
      </div>
    );
  }

  const isHost = session?.user?.id === interview.hostId;
  const isParticipant = isHost || session?.user?.id === interview.guestId;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Problem & Notes */}
      <div className="w-1/3 border-r flex flex-col">
        <Tabs defaultValue="problem" className="flex-1 flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="problem">
                <FileCode className="h-4 w-4 mr-2" />
                Problem
              </TabsTrigger>
              <TabsTrigger value="notes">
                <MessageSquare className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="participants">
                <Users className="h-4 w-4 mr-2" />
                Info
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="problem" className="flex-1 overflow-auto p-4 m-0">
            {isHost && interview.status === "SCHEDULED" && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select Problem</label>
                <Select value={selectedProblemId} onValueChange={handleSelectProblem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a problem" />
                  </SelectTrigger>
                  <SelectContent>
                    {problems.map((problem) => (
                      <SelectItem key={problem.id} value={problem.id}>
                        <span className={getDifficultyColor(problem.difficulty)}>
                          [{problem.difficulty}]
                        </span>{" "}
                        {problem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {interview.problem ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{interview.problem.title}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(interview.problem.difficulty)}>
                      {interview.problem.difficulty}
                    </Badge>
                    {interview.problem.topics.map((topic) => (
                      <Badge key={topic} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div
                  className="prose prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: interview.problem.description }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isHost
                  ? "Select a problem to get started"
                  : "Waiting for interviewer to select a problem"}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="flex-1 overflow-auto p-4 m-0">
            <Textarea
              placeholder="Take notes during the interview..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-full resize-none"
            />
          </TabsContent>

          <TabsContent value="participants" className="flex-1 overflow-auto p-4 m-0">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Session Details</h3>
                <p className="text-sm text-muted-foreground">
                  Scheduled: {formatDateTime(interview.scheduledAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {interview.status.replace("_", " ")}
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Interviewer</h3>
                <p className="text-sm">{interview.host.name}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Interviewee</h3>
                <p className="text-sm">{interview.guest?.name || "Not joined yet"}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Video Chat */}
        {showVideo && interview.roomUrl && (
          <div className="border-t p-2">
            <VideoChat
              roomUrl={interview.roomUrl}
              userName={session?.user?.name || "User"}
              onLeave={() => setShowVideo(false)}
            />
          </div>
        )}
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-4">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_NAMES).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-lg">{formatTime(timer)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVideo(!showVideo)}
            >
              {showVideo ? (
                <VideoOff className="h-4 w-4 mr-2" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              {showVideo ? "Hide Video" : "Show Video"}
            </Button>

            {interview.status === "SCHEDULED" && isParticipant && (
              <Button onClick={handleStartInterview}>
                <Play className="h-4 w-4 mr-2" />
                Start Interview
              </Button>
            )}

            {interview.status === "IN_PROGRESS" && isParticipant && (
              <Button variant="destructive" onClick={handleEndInterview}>
                End Interview
              </Button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            collaborative={interview.status === "IN_PROGRESS"}
            roomId={interview.id}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
