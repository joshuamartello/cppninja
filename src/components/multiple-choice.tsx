"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Choice {
  id: string;
  text: string;
}

interface MultipleChoiceProps {
  problemId: string;
  choices: Choice[];
  explanation: string;
  onSubmit?: (correct: boolean) => void;
}

export function MultipleChoice({
  problemId,
  choices,
  explanation,
  onSubmit,
}: MultipleChoiceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    correctAnswer: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!selectedId) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/submissions/multiple-choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          selectedAnswer: selectedId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        onSubmit?.(data.correct);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChoiceStyles = (choiceId: string) => {
    if (!result) {
      return selectedId === choiceId
        ? "border-primary bg-primary/10"
        : "border-border/50 hover:border-primary/50 hover:bg-primary/5";
    }

    if (choiceId === result.correctAnswer) {
      return "border-emerald-500 bg-emerald-500/10";
    }

    if (choiceId === selectedId && !result.correct) {
      return "border-red-500 bg-red-500/10";
    }

    return "border-border/30 opacity-50";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => !result && setSelectedId(choice.id)}
            disabled={!!result}
            className={cn(
              "w-full p-4 rounded-lg border text-left transition-all duration-200",
              getChoiceStyles(choice.id),
              !result && "cursor-pointer"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                  selectedId === choice.id && !result
                    ? "border-primary bg-primary"
                    : result && choice.id === result.correctAnswer
                    ? "border-emerald-500 bg-emerald-500"
                    : result && choice.id === selectedId
                    ? "border-red-500 bg-red-500"
                    : "border-muted-foreground/50"
                )}
              >
                {result && choice.id === result.correctAnswer && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
                {result && choice.id === selectedId && !result.correct && (
                  <XCircle className="w-4 h-4 text-white" />
                )}
                {!result && selectedId === choice.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm whitespace-pre-wrap">{choice.text}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {!result ? (
        <Button
          onClick={handleSubmit}
          disabled={!selectedId || isSubmitting}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Submit Answer"
          )}
        </Button>
      ) : (
        <div
          className={cn(
            "p-4 rounded-lg border",
            result.correct
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          )}
        >
          <p
            className={cn(
              "font-semibold mb-2",
              result.correct ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {result.correct ? "Correct!" : "Not quite right"}
          </p>
          <div className="text-sm text-muted-foreground prose prose-invert prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: explanation }} />
          </div>
        </div>
      )}
    </div>
  );
}
