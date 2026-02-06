import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDate, getDifficultyColor, getStatusColor } from "@/lib/utils";
import { Code2, Video, Trophy, Clock } from "lucide-react";

async function getUserStats(userId: string) {
  const [submissions, interviews, solvedProblems] = await Promise.all([
    prisma.submission.count({ where: { userId } }),
    prisma.interview.count({
      where: { OR: [{ hostId: userId }, { guestId: userId }] },
    }),
    prisma.submission.findMany({
      where: { userId, status: "ACCEPTED" },
      select: { problemId: true },
      distinct: ["problemId"],
    }),
  ]);

  return {
    totalSubmissions: submissions,
    totalInterviews: interviews,
    problemsSolved: solvedProblems.length,
  };
}

async function getRecentSubmissions(userId: string) {
  return prisma.submission.findMany({
    where: { userId },
    include: { problem: { select: { title: true, slug: true, difficulty: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

async function getUpcomingInterviews(userId: string) {
  return prisma.interview.findMany({
    where: {
      OR: [{ hostId: userId }, { guestId: userId }],
      scheduledAt: { gte: new Date() },
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    include: {
      host: { select: { name: true, image: true } },
      guest: { select: { name: true, image: true } },
      problem: { select: { title: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const [stats, recentSubmissions, upcomingInterviews] = await Promise.all([
    getUserStats(session.user.id),
    getRecentSubmissions(session.user.id),
    getUpcomingInterviews(session.user.id),
  ]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Welcome Section */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
          <AvatarFallback>{session.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {session.user.name}</h1>
          <p className="text-muted-foreground">Here's your coding journey so far</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.problemsSolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mock Interviews</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInterviews}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Your latest coding attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/problems/${submission.problem.slug}`}
                        className="font-medium hover:underline"
                      >
                        {submission.problem.title}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={getDifficultyColor(submission.problem.difficulty)}>
                          {submission.problem.difficulty}
                        </span>
                        <span>•</span>
                        <span>{submission.language}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={submission.status === "ACCEPTED" ? "success" : "destructive"}
                        className="mb-1"
                      >
                        {submission.status.replace("_", " ")}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(submission.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No submissions yet</p>
            )}

            <Separator className="my-4" />

            <Button variant="outline" className="w-full" asChild>
              <Link href="/problems">Solve More Problems</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Your scheduled mock interviews</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => {
                  const partner =
                    interview.hostId === session.user.id ? interview.guest : interview.host;

                  return (
                    <div key={interview.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={partner?.image || undefined} />
                          <AvatarFallback>
                            {partner?.name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{partner?.name || "TBD"}</p>
                          <p className="text-sm text-muted-foreground">
                            {interview.problem?.title || "Problem TBD"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            interview.status === "IN_PROGRESS" ? "success" : "secondary"
                          }
                        >
                          {interview.status.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(interview.scheduledAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming interviews</p>
            )}

            <Separator className="my-4" />

            <Button variant="outline" className="w-full" asChild>
              <Link href="/interviews">Find Interview Partner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
