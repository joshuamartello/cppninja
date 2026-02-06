import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils";
import { Plus, Clock, Video, Calendar } from "lucide-react";
import { CreateInterviewDialog } from "./create-interview-dialog";
import { CreateRequestDialog } from "./create-request-dialog";

async function getMyInterviews(userId: string) {
  return prisma.interview.findMany({
    where: {
      OR: [{ hostId: userId }, { guestId: userId }],
    },
    include: {
      host: { select: { id: true, name: true, image: true } },
      guest: { select: { id: true, name: true, image: true } },
      problem: { select: { title: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
}

async function getOpenRequests(userId: string) {
  return prisma.interviewRequest.findMany({
    where: {
      status: "OPEN",
      userId: { not: userId },
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { preferredTime: "asc" },
  });
}

async function getMyRequests(userId: string) {
  return prisma.interviewRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export default async function InterviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const [myInterviews, openRequests, myRequests] = await Promise.all([
    getMyInterviews(session.user.id),
    getOpenRequests(session.user.id),
    getMyRequests(session.user.id),
  ]);

  const upcomingInterviews = myInterviews.filter(
    (i) => i.status === "SCHEDULED" && new Date(i.scheduledAt) >= new Date()
  );
  const pastInterviews = myInterviews.filter(
    (i) => i.status === "COMPLETED" || new Date(i.scheduledAt) < new Date()
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mock Interviews</h1>
          <p className="text-muted-foreground">
            Practice with peers and improve your interview skills.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateRequestDialog />
          <CreateInterviewDialog />
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="find">
            Find Partner ({openRequests.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            My Requests ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingInterviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingInterviews.map((interview) => {
                const isHost = interview.hostId === session.user.id;
                const partner = isHost ? interview.guest : interview.host;

                return (
                  <Card key={interview.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={partner?.image || undefined} />
                            <AvatarFallback>
                              {partner?.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {partner?.name || "Partner TBD"}
                            </CardTitle>
                            <CardDescription>
                              You are the {isHost ? "Interviewer" : "Interviewee"}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge>{interview.status.replace("_", " ")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDateTime(interview.scheduledAt)}</span>
                        </div>
                        {interview.problem && (
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <span>{interview.problem.title}</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full mt-4" asChild>
                        <Link href={`/interviews/${interview.id}`}>
                          {interview.status === "IN_PROGRESS" ? "Join Room" : "View Details"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No upcoming interviews</p>
                <CreateInterviewDialog />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="find">
          {openRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.user.image || undefined} />
                        <AvatarFallback>
                          {request.user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{request.user.name}</CardTitle>
                        <CardDescription>
                          Wants to be {request.role.toLowerCase().replace("_", " ")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(request.preferredTime)}</span>
                      </div>
                      {request.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {request.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button className="w-full" variant="outline">
                      Send Request
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No open requests from other users
                </p>
                <CreateRequestDialog />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {myRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {request.role.replace("_", " ")}
                      </CardTitle>
                      <Badge
                        variant={
                          request.status === "OPEN"
                            ? "default"
                            : request.status === "MATCHED"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(request.preferredTime)}</span>
                      </div>
                      {request.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {request.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't created any interview requests
                </p>
                <CreateRequestDialog />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastInterviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {pastInterviews.map((interview) => {
                const isHost = interview.hostId === session.user.id;
                const partner = isHost ? interview.guest : interview.host;

                return (
                  <Card key={interview.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={partner?.image || undefined} />
                          <AvatarFallback>
                            {partner?.name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{partner?.name}</CardTitle>
                          <CardDescription>
                            {formatDateTime(interview.scheduledAt)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {interview.problem && (
                        <p className="text-sm text-muted-foreground">
                          Problem: {interview.problem.title}
                        </p>
                      )}
                      <Button className="w-full mt-4" variant="outline" asChild>
                        <Link href={`/interviews/${interview.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No past interviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
