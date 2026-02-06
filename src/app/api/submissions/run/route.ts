import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runCode, runWithHarness, runDirect, runMultiFile } from "@/lib/judge0";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, files, testCases, testType, testHarness, runDirect: shouldRunDirect } = await request.json();

    if (!code && !files) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle multi-file execution
    if (files && Object.keys(files).length > 1) {
      const sourceFiles = Object.entries(files).map(([filename, content]) => ({
        filename,
        content: content as string,
      }));

      const result = await runMultiFile(sourceFiles);

      return NextResponse.json({
        passed: result.status.id === 3,
        results: [{
          input: "",
          expected: "",
          actual: result.output,
          passed: result.status.id === 3,
          time: result.time,
          memory: result.memory,
          error: result.error,
        }],
        status: result.status,
      });
    }

    // Handle direct execution (run code as-is, no test cases)
    if (shouldRunDirect) {
      const result = await runDirect(code);

      return NextResponse.json({
        passed: result.status.id === 3, // 3 = ran successfully
        results: [{
          input: "",
          expected: "",
          actual: result.output,
          passed: result.status.id === 3,
          time: result.time,
          memory: result.memory,
          error: result.error,
        }],
        status: result.status,
      });
    }

    // Handle UNIT_TEST type with harness
    if (testType === "UNIT_TEST" && testHarness) {
      const result = await runWithHarness(code, testHarness);

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
        status: result.status,
      });
    }

    // Handle STDIN_STDOUT type (default)
    if (!testCases) {
      return NextResponse.json(
        { error: "Missing test cases for STDIN_STDOUT problem" },
        { status: 400 }
      );
    }

    const { passed, results } = await runCode(code, testCases);

    return NextResponse.json({ passed, results });
  } catch (error) {
    console.error("Run error:", error);
    return NextResponse.json(
      { error: "Failed to run code" },
      { status: 500 }
    );
  }
}
