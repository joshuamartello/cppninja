import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { problemId, selectedAnswer } = await request.json();

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    if (problem.type !== "MULTIPLE_CHOICE") {
      return NextResponse.json(
        { error: "This is not a multiple choice problem" },
        { status: 400 }
      );
    }

    const correct = selectedAnswer === problem.correctAnswer;

    // If user is logged in, save the submission
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        await prisma.submission.create({
          data: {
            userId: user.id,
            problemId: problem.id,
            code: selectedAnswer, // Store the selected answer in the code field
            language: "multiple_choice",
            status: correct ? "ACCEPTED" : "WRONG_ANSWER",
          },
        });
      }
    }

    return NextResponse.json({
      correct,
      correctAnswer: problem.correctAnswer,
    });
  } catch (error) {
    console.error("Multiple choice submission error:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
