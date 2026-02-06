import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getDifficultyColor } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ProblemCardProps {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  topics: string[];
  type?: "CODE" | "MULTIPLE_CHOICE" | "CODE_REVIEW";
  solved?: boolean;
}

export function ProblemCard({
  title,
  slug,
  difficulty,
  topics,
  type = "CODE",
  solved,
}: ProblemCardProps) {
  return (
    <Link href={`/problems/${slug}`}>
      <div className="group flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${
            difficulty === "EASY" ? "bg-emerald-500" :
            difficulty === "MEDIUM" ? "bg-amber-500" : "bg-red-500"
          }`} />

          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              {type === "MULTIPLE_CHOICE" && (
                <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                  Quiz
                </Badge>
              )}
              {type === "CODE_REVIEW" && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-500 text-xs">
                  Review
                </Badge>
              )}
              {solved && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Solved
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-medium ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
              <span className="text-muted-foreground">·</span>
              <div className="flex gap-1.5">
                {topics.slice(0, 2).map((topic) => (
                  <span key={topic} className="text-xs text-muted-foreground">
                    {topic}
                  </span>
                ))}
                {topics.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{topics.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
