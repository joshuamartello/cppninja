import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProblemCard } from "@/components/problem-card";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";

interface ProblemsPageProps {
  searchParams: { difficulty?: string; topic?: string };
}

async function getProblems(filters: { difficulty?: string; topic?: string }) {
  const where: Record<string, unknown> = {};

  if (filters.difficulty && filters.difficulty !== "all") {
    where.difficulty = filters.difficulty.toUpperCase();
  }

  if (filters.topic && filters.topic !== "all") {
    where.topics = { has: filters.topic };
  }

  return prisma.problem.findMany({
    where,
    orderBy: [
      { difficulty: "asc" },
      { createdAt: "desc" },
    ],
  });
}

function ProblemsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}

async function ProblemsList({ filters }: { filters: ProblemsPageProps["searchParams"] }) {
  const problems = await getProblems(filters);

  if (problems.length === 0) {
    return (
      <div className="text-center py-16">
        <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No problems found</p>
      </div>
    );
  }

  const easyProblems = problems.filter(p => p.difficulty === "EASY");
  const mediumProblems = problems.filter(p => p.difficulty === "MEDIUM");
  const hardProblems = problems.filter(p => p.difficulty === "HARD");

  return (
    <div className="space-y-8">
      {easyProblems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Easy
            <span className="text-muted-foreground font-normal text-sm">({easyProblems.length})</span>
          </h2>
          <div className="space-y-2">
            {easyProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                id={problem.id}
                title={problem.title}
                slug={problem.slug}
                difficulty={problem.difficulty}
                topics={problem.topics}
                type={problem.type}
              />
            ))}
          </div>
        </div>
      )}

      {mediumProblems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Medium
            <span className="text-muted-foreground font-normal text-sm">({mediumProblems.length})</span>
          </h2>
          <div className="space-y-2">
            {mediumProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                id={problem.id}
                title={problem.title}
                slug={problem.slug}
                difficulty={problem.difficulty}
                topics={problem.topics}
                type={problem.type}
              />
            ))}
          </div>
        </div>
      )}

      {hardProblems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Hard
            <span className="text-muted-foreground font-normal text-sm">({hardProblems.length})</span>
          </h2>
          <div className="space-y-2">
            {hardProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                id={problem.id}
                title={problem.title}
                slug={problem.slug}
                difficulty={problem.difficulty}
                topics={problem.topics}
                type={problem.type}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">C++ Problems</h1>
        <p className="text-muted-foreground">
          Practice with our curated collection of coding challenges
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-8">
        <Button
          variant={!searchParams.difficulty || searchParams.difficulty === "all" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <a href="/problems">All</a>
        </Button>
        <Button
          variant={searchParams.difficulty === "easy" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <a href="/problems?difficulty=easy">Easy</a>
        </Button>
        <Button
          variant={searchParams.difficulty === "medium" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <a href="/problems?difficulty=medium">Medium</a>
        </Button>
        <Button
          variant={searchParams.difficulty === "hard" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <a href="/problems?difficulty=hard">Hard</a>
        </Button>
      </div>

      <Suspense fallback={<ProblemsListSkeleton />}>
        <ProblemsList filters={searchParams} />
      </Suspense>
    </div>
  );
}
