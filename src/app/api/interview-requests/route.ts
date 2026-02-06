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

    const { preferredTime, role, topics } = await request.json();

    if (!preferredTime || !role) {
      return NextResponse.json(
        { error: "preferredTime and role are required" },
        { status: 400 }
      );
    }

    const interviewRequest = await prisma.interviewRequest.create({
      data: {
        userId: session.user.id,
        preferredTime: new Date(preferredTime),
        role,
        topics: topics || [],
        status: "OPEN",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(interviewRequest);
  } catch (error) {
    console.error("Failed to create interview request:", error);
    return NextResponse.json(
      { error: "Failed to create interview request" },
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const includeOwn = searchParams.get("includeOwn") === "true";

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status.toUpperCase();
    } else {
      where.status = "OPEN";
    }

    if (!includeOwn) {
      where.userId = { not: session.user.id };
    }

    // Only show requests with preferred time in the future
    where.preferredTime = { gte: new Date() };

    const requests = await prisma.interviewRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { preferredTime: "asc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch interview requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview requests" },
      { status: 500 }
    );
  }
}
