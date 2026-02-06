import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createRoom, createMeetingToken } from "@/lib/daily";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        host: { select: { id: true, name: true } },
        guest: { select: { id: true, name: true } },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Only participants can start
    if (
      interview.hostId !== session.user.id &&
      interview.guestId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already started
    if (interview.status === "IN_PROGRESS") {
      return NextResponse.json(interview);
    }

    // Create Daily.co room
    const roomName = `cppninja-${params.id}`;
    let roomUrl = interview.roomUrl;

    if (!roomUrl) {
      try {
        const room = await createRoom({
          name: roomName,
          expiryMinutes: 120, // 2 hours
          maxParticipants: 4,
        });
        roomUrl = room.url;
      } catch (dailyError) {
        console.error("Failed to create Daily room:", dailyError);
        // Continue without video if Daily fails
        roomUrl = null;
      }
    }

    // Update interview status
    const updated = await prisma.interview.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
        roomId: roomName,
        roomUrl,
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        guest: { select: { id: true, name: true, image: true } },
        problem: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to start interview:", error);
    return NextResponse.json(
      { error: "Failed to start interview" },
      { status: 500 }
    );
  }
}
