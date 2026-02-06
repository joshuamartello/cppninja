import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { runCode, runWithHarness } from "@/lib/judge0";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemId, code } = await request.json();

    if (!problemId || !code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get problem with test cases
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        userId: session.user.id,
        problemId,
        code,
        language: "cpp",
        status: "RUNNING",
      },
    });

    try {
      // Check if this is a UNIT_TEST problem
      if (problem.testType === "UNIT_TEST" && problem.testHarness) {
        // Run with test harness (for compile-time testing)
        const result = await runWithHarness(code, problem.testHarness);

        // Determine status based on Judge0 status codes
        let status: string;
        if (result.passed) {
          status = "ACCEPTED";
        } else if (result.status.id === 6) {
          // 6 = Compilation Error
          status = "COMPILATION_ERROR";
        } else if (result.status.id === 5) {
          // 5 = Time Limit Exceeded
          status = "TIME_LIMIT_EXCEEDED";
        } else if (result.status.id === 12) {
          // 12 = Out of Memory
          status = "MEMORY_LIMIT_EXCEEDED";
        } else if (result.status.id >= 7 && result.status.id <= 12) {
          // 7-12 are various runtime errors
          status = "RUNTIME_ERROR";
        } else {
          status = "WRONG_ANSWER";
        }

        // Update submission
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: status as any,
            runtime: result.time ? Math.round(parseFloat(result.time)) : null,
            memory: result.memory,
            output: result.output,
            error: result.error,
          },
        });

        return NextResponse.json({
          passed: result.passed,
          results: [{
            input: "Test harness",
            expected: "PASS",
            actual: result.output,
            passed: result.passed,
            time: result.time,
            memory: result.memory,
            error: result.error,
          }],
          status,
          runtime: result.time ? Math.round(parseFloat(result.time)) : null,
          memory: result.memory,
        });
      }

      // STDIN_STDOUT: Run code against all test cases
      const testCases = problem.testCases as { input: string; expectedOutput: string; isHidden: boolean }[];
      const { passed, results } = await runCode(code, testCases);

      // Calculate runtime and memory (average of successful tests)
      const successfulResults = results.filter((r) => r.time);
      const avgRuntime = successfulResults.length > 0
        ? Math.round(
            successfulResults.reduce((sum, r) => sum + parseFloat(r.time || "0"), 0) /
              successfulResults.length
          )
        : null;
      const avgMemory = successfulResults.length > 0
        ? Math.round(
            successfulResults.reduce((sum, r) => sum + (r.memory || 0), 0) /
              successfulResults.length
          )
        : null;

      // Determine status
      let status: string;
      if (passed) {
        status = "ACCEPTED";
      } else {
        const failedResult = results.find((r) => !r.passed);
        if (failedResult?.error?.includes("compilation")) {
          status = "COMPILATION_ERROR";
        } else if (failedResult?.error?.includes("time")) {
          status = "TIME_LIMIT_EXCEEDED";
        } else if (failedResult?.error?.includes("memory")) {
          status = "MEMORY_LIMIT_EXCEEDED";
        } else if (failedResult?.error) {
          status = "RUNTIME_ERROR";
        } else {
          status = "WRONG_ANSWER";
        }
      }

      // Update submission
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: status as any,
          runtime: avgRuntime,
          memory: avgMemory,
          output: results.map((r) => r.actual).join("\n---\n"),
          error: results.find((r) => r.error)?.error || null,
        },
      });

      // Return results (hiding hidden test case details)
      const visibleResults = results.map((result, i) => {
        const testCase = testCases[i];
        if (testCase.isHidden) {
          return {
            ...result,
            input: "Hidden",
            expected: "Hidden",
            actual: result.passed ? "Correct" : "Incorrect",
          };
        }
        return result;
      });

      return NextResponse.json({
        passed,
        results: visibleResults,
        status,
        runtime: avgRuntime,
        memory: avgMemory,
      });
    } catch (execError) {
      // Update submission with error
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "RUNTIME_ERROR",
          error: execError instanceof Error ? execError.message : "Unknown error",
        },
      });

      return NextResponse.json({
        passed: false,
        results: [],
        status: "RUNTIME_ERROR",
        error: execError instanceof Error ? execError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
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
    const problemId = searchParams.get("problemId");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (problemId) {
      where.problemId = problemId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        problem: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
