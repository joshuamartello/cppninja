"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { MultipleChoice } from "@/components/multiple-choice";

// Dynamically import CodeEditor with SSR disabled (monaco requires window)
const CodeEditor = dynamic(
  () => import("@/components/code-editor").then((mod) => mod.CodeEditor),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div> }
);
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getDifficultyColor, formatRuntime, formatMemory } from "@/lib/utils";
import { Play, Send, Loader2 } from "lucide-react";

interface StarterFile {
  filename: string;
  language: string;
  code: string;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  topics: string[];
  type: "CODE" | "MULTIPLE_CHOICE" | "CODE_REVIEW";
  testType?: "STDIN_STDOUT" | "UNIT_TEST";
  testHarness?: string;
  starterCode?: StarterFile[];
  testCases?: { input: string; expectedOutput: string; isHidden: boolean }[];
  choices?: { id: string; text: string }[];
  explanation?: string;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string | null;
  passed: boolean;
  time: string | null;
  memory: number | null;
  error: string | null;
}

interface SubmissionResult {
  passed: boolean;
  results: TestResult[];
}

export default function ProblemPage() {
  const params = useParams();
  const slug = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<SubmissionResult | null>(null);
  const [activeTab, setActiveTab] = useState("description");

  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle resize
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Clamp between 20% and 80%
    setLeftPanelWidth(Math.min(80, Math.max(20, newWidth)));
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await fetch(`/api/problems/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProblem(data);
          // Load starter code for CODE and CODE_REVIEW problems
          if (data.type !== "MULTIPLE_CHOICE" && data.starterCode) {
            const starterFiles = data.starterCode.filter(
              (s: StarterFile) => s.language === "cpp"
            );
            if (starterFiles.length > 0) {
              // Build files object from starter code
              const filesObj: Record<string, string> = {};
              starterFiles.forEach((f: StarterFile) => {
                // Use filename if provided, otherwise default to "solution.cpp"
                const filename = f.filename || "solution.cpp";
                filesObj[filename] = f.code;
              });
              setFiles(filesObj);
              // Set active file to the first one
              const firstFile = starterFiles[0].filename || "solution.cpp";
              setActiveFile(firstFile);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch problem:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProblem();
  }, [slug]);

  // Get combined code from all files (for multi-file problems)
  const getCombinedCode = () => {
    const filenames = Object.keys(files);
    if (filenames.length === 1) {
      return files[filenames[0]];
    }
    // For multi-file, concatenate all files with comments
    return filenames
      .map((filename) => `// === ${filename} ===\n${files[filename]}`)
      .join("\n\n");
  };

  const handleRun = async () => {
    if (!problem || problem.type === "MULTIPLE_CHOICE") return;

    setIsRunning(true);
    setResults(null);
    setActiveTab("results");

    const fileCount = Object.keys(files).length;
    const isMultiFile = fileCount > 1;
    const code = getCombinedCode();

    try {
      // For multi-file problems, use multi-file compilation
      if (isMultiFile) {
        const res = await fetch("/api/submissions/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files }),
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      }
      // For UNIT_TEST problems, run the code directly (no harness)
      else if (problem.testType === "UNIT_TEST") {
        const res = await fetch("/api/submissions/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            runDirect: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } else {
        // STDIN_STDOUT: use test cases
        const visibleTests = problem.testCases?.filter((tc) => !tc.isHidden) || [];
        const res = await fetch("/api/submissions/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            testCases: visibleTests.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      }
    } catch (error) {
      console.error("Failed to run code:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || problem.type === "MULTIPLE_CHOICE") return;

    setIsSubmitting(true);
    setResults(null);
    setActiveTab("results");

    const code = getCombinedCode();

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Failed to submit code:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Problem not found</p>
      </div>
    );
  }

  // Multiple Choice Layout
  if (problem.type === "MULTIPLE_CHOICE") {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${getDifficultyColor(problem.difficulty)} border-0`}>
                {problem.difficulty}
              </Badge>
              <Badge variant="outline" className="border-primary/50 text-primary">
                Multiple Choice
              </Badge>
              {problem.topics.map((topic) => (
                <Badge key={topic} variant="outline" className="border-border/50">
                  {topic}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold mb-4 text-foreground">{problem.title}</h1>
          </div>

          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-foreground prose-p:text-muted-foreground
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-border/30
              prose-li:text-muted-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: problem.description }}
          />

          <Separator className="bg-border/50" />

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Select your answer:</h3>
            <MultipleChoice
              problemId={problem.id}
              choices={problem.choices || []}
              explanation={problem.explanation || ""}
            />
          </div>
        </div>
      </div>
    );
  }

  // Code Problem Layout
  const visibleTestCases = problem.testCases?.filter((tc) => !tc.isHidden) || [];

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-4rem)]" style={{ cursor: isResizing ? 'col-resize' : 'default', userSelect: isResizing ? 'none' : 'auto' }}>
      {/* Left Panel - Problem Description */}
      <div style={{ width: `${leftPanelWidth}%` }} className="overflow-auto bg-card/30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b border-border/50 px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="description" className="data-[state=active]:bg-primary/20">
                Description
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-primary/20">
                Results
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="description" className="p-6 m-0">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-3 text-foreground">{problem.title}</h1>
                <div className="flex items-center gap-3">
                  <Badge className={`${getDifficultyColor(problem.difficulty)} border-0`}>
                    {problem.difficulty}
                  </Badge>
                  {problem.topics.map((topic) => (
                    <Badge key={topic} variant="outline" className="border-border/50">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div
                className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-foreground prose-p:text-muted-foreground
                  prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
                  prose-li:text-muted-foreground prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              />

              <Separator className="bg-border/50" />

              <div>
                <h3 className="font-semibold mb-3 text-foreground">Examples</h3>
                {visibleTestCases.map((tc, i) => (
                  <div key={i} className="mb-4 p-4 bg-muted/30 rounded-lg border border-border/30 font-mono text-sm">
                    <div className="mb-2">
                      <span className="text-muted-foreground">Input: </span>
                      <pre className="inline text-foreground whitespace-pre-wrap">{tc.input}</pre>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Output: </span>
                      <span className="text-primary">{tc.expectedOutput}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="p-6 m-0">
            {results ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${
                    results.passed
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <p className={`font-semibold ${results.passed ? "text-emerald-400" : "text-red-400"}`}>
                    {results.passed ? "All Tests Passed!" : "Some Tests Failed"}
                  </p>
                </div>

                {results.results.map((result, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      result.passed
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Test Case {i + 1}</span>
                      <Badge className={result.passed ? "bg-emerald-500" : "bg-red-500"}>
                        {result.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>

                    <div className="space-y-2 font-mono text-sm">
                      <div>
                        <span className="text-muted-foreground">Input: </span>
                        <pre className="inline text-foreground whitespace-pre-wrap">{result.input}</pre>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected: </span>
                        <span className="text-primary">{result.expected}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Output: </span>
                        <span className={result.passed ? "text-emerald-400" : "text-red-400"}>
                          {result.actual || "No output"}
                        </span>
                      </div>
                      {result.error && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded text-red-400">
                          <pre className="whitespace-pre-wrap text-xs">{result.error}</pre>
                        </div>
                      )}
                      {result.time && (
                        <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                          Runtime: {formatRuntime(parseFloat(result.time))} | Memory: {formatMemory(result.memory)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Run your code to see results</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize hover:bg-primary/50 transition-colors ${
          isResizing ? 'bg-primary' : 'bg-border/50'
        }`}
      />

      {/* Right Panel - Code Editor */}
      <div style={{ width: `${100 - leftPanelWidth}%` }} className="flex flex-col bg-[#1e1e1e]">
        {/* Editor Header with File Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-[#252526]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="border-border/50 hover:bg-primary/20 hover:border-primary/50"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit
            </Button>
          </div>
        </div>

        {/* File Tabs */}
        {Object.keys(files).length > 0 && (
          <div className="flex border-b border-border/30 bg-[#252526]">
            {Object.keys(files).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`px-4 py-2 text-sm font-mono border-r border-border/30 transition-colors ${
                  activeFile === filename
                    ? "bg-[#1e1e1e] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-[#2d2d2d]"
                }`}
              >
                {filename}
              </button>
            ))}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={files[activeFile] || ""}
            onChange={(newCode) => setFiles((prev) => ({ ...prev, [activeFile]: newCode }))}
            language="cpp"
          />
        </div>
      </div>
    </div>
  );
}
