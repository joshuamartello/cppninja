import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteRoom } from "@/lib/daily";

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
    });

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Only participants can end
    if (
      interview.hostId !== session.user.id &&
      interview.guestId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sharedCode, notes } = await request.json();

    // Delete Daily.co room if it exists
    if (interview.roomId) {
      try {
        await deleteRoom(interview.roomId);
      } catch (dailyError) {
        console.error("Failed to delete Daily room:", dailyError);
        // Continue even if room deletion fails
      }
    }

    // Update interview status
    const updated = await prisma.interview.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        sharedCode: sharedCode || interview.sharedCode,
        notes: notes || interview.notes,
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        guest: { select: { id: true, name: true, image: true } },
        problem: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to end interview:", error);
    return NextResponse.json(
      { error: "Failed to end interview" },
      { status: 500 }
    );
  }
}
