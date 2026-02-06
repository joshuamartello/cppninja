import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduledAt, guestId, problemId } = await request.json();

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt is required" },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        hostId: session.user.id,
        guestId: guestId || null,
        problemId: problemId || null,
        scheduledAt: new Date(scheduledAt),
        status: "SCHEDULED",
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        guest: { select: { id: true, name: true, image: true } },
        problem: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Failed to create interview:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interviews = await prisma.interview.findMany({
      where: {
        OR: [{ hostId: session.user.id }, { guestId: session.user.id }],
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        guest: { select: { id: true, name: true, image: true } },
        problem: { select: { id: true, title: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
