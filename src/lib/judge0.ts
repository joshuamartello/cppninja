import JSZip from "jszip";

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";

// Language IDs for Judge0
export const LANGUAGE_ID = 105; // C++ (GCC 14.1.0)
export const MULTI_FILE_LANGUAGE_ID = 89; // Multi-file program

export const LANGUAGE_NAME = "C++";

export const LANGUAGE_NAMES: Record<string, string> = {
  cpp: "C++",
};

interface SubmissionResult {
  token: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

interface CreateSubmissionParams {
  sourceCode: string;
  languageId: number;
  stdin?: string;
  expectedOutput?: string;
  compilerOptions?: string;
}

export async function createSubmission(params: CreateSubmissionParams): Promise<string> {
  const { sourceCode, languageId, stdin, expectedOutput, compilerOptions } = params;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add RapidAPI headers only if using RapidAPI
  if (JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=false`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: Buffer.from(sourceCode).toString("base64"),
      language_id: languageId,
      stdin: stdin ? Buffer.from(stdin).toString("base64") : undefined,
      expected_output: expectedOutput ? Buffer.from(expectedOutput).toString("base64") : undefined,
      compiler_options: compilerOptions,
    }),
  });

  if (!response.ok) {
    throw new Error(`Judge0 API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

interface SourceFile {
  filename: string;
  content: string;
}

export async function createMultiFileSubmission(
  files: SourceFile[],
  stdin?: string
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  // Create zip archive with source files and compile/run scripts
  const zip = new JSZip();

  // Add all source files
  const cppFiles: string[] = [];
  for (const file of files) {
    zip.file(file.filename, file.content);
    if (file.filename.endsWith(".cpp")) {
      cppFiles.push(file.filename);
    }
  }

  // Create compile script
  const compileScript = `#!/bin/bash
g++ -std=c++26 -o program ${cppFiles.join(" ")}
`;
  zip.file("compile", compileScript);

  // Create run script
  const runScript = `#!/bin/bash
./program
`;
  zip.file("run", runScript);

  // Generate base64-encoded zip
  const zipContent = await zip.generateAsync({ type: "base64" });

  const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=false`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      language_id: MULTI_FILE_LANGUAGE_ID,
      additional_files: zipContent,
      stdin: stdin ? Buffer.from(stdin).toString("base64") : undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.token;
}

export async function runMultiFile(
  files: SourceFile[],
  stdin?: string
): Promise<{
  output: string | null;
  error: string | null;
  time: string | null;
  memory: number | null;
  status: {
    id: number;
    description: string;
  };
}> {
  const token = await createMultiFileSubmission(files, stdin);

  // Poll for result
  let result: SubmissionResult;
  let attempts = 0;
  const maxAttempts = 30;

  do {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    result = await getSubmission(token);
    attempts++;
  } while (result.status.id <= 2 && attempts < maxAttempts);

  return {
    output: result.stdout?.trim() || null,
    error: result.stderr || result.compile_output || result.message,
    time: result.time,
    memory: result.memory,
    status: result.status,
  };
}

export async function getSubmission(token: string): Promise<SubmissionResult> {
  const headers: Record<string, string> = {};

  // Add RapidAPI headers only if using RapidAPI
  if (JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  const response = await fetch(
    `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=true&fields=*`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Judge0 API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    token: data.token,
    stdout: data.stdout ? Buffer.from(data.stdout, "base64").toString() : null,
    stderr: data.stderr ? Buffer.from(data.stderr, "base64").toString() : null,
    compile_output: data.compile_output
      ? Buffer.from(data.compile_output, "base64").toString()
      : null,
    message: data.message,
    status: data.status,
    time: data.time,
    memory: data.memory,
  };
}

export async function runDirect(
  sourceCode: string
): Promise<{
  output: string | null;
  error: string | null;
  time: string | null;
  memory: number | null;
  status: {
    id: number;
    description: string;
  };
}> {
  const token = await createSubmission({
    sourceCode,
    languageId: LANGUAGE_ID,
    compilerOptions: "-std=c++26",
  });

  // Poll for result
  let result: SubmissionResult;
  let attempts = 0;
  const maxAttempts = 30;

  do {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    result = await getSubmission(token);
    attempts++;
  } while (result.status.id <= 2 && attempts < maxAttempts);

  return {
    output: result.stdout?.trim() || null,
    error: result.stderr || result.compile_output || result.message,
    time: result.time,
    memory: result.memory,
    status: result.status,
  };
}

export async function runWithHarness(
  userCode: string,
  testHarness: string
): Promise<{
  passed: boolean;
  output: string | null;
  error: string | null;
  time: string | null;
  memory: number | null;
  status: {
    id: number;
    description: string;
  };
}> {
  // If user code contains a main function, change its return type to ignorable
  // so it becomes a struct initialization instead of conflicting with the harness main
  let processedCode = userCode;
  if (/\bint\s+main\s*\(/.test(userCode)) {
    processedCode = userCode.replace(/\bint\s+(main\s*\()/g, "ignorable $1");

    // Add "return 0;" before the last brace of main function
    const mainMatch = processedCode.match(/\bignorable\s+main\s*\([^)]*\)\s*\{/);
    if (mainMatch) {
      const mainStart = processedCode.indexOf(mainMatch[0]);
      const braceStart = processedCode.indexOf("{", mainStart);

      // Find matching closing brace
      let depth = 1;
      let i = braceStart + 1;
      while (i < processedCode.length && depth > 0) {
        if (processedCode[i] === "{") depth++;
        else if (processedCode[i] === "}") depth--;
        i++;
      }

      // Insert "return 0;" before the closing brace
      if (depth === 0) {
        const closingBraceIndex = i - 1;
        processedCode =
          processedCode.slice(0, closingBraceIndex) +
          "\n    return 0;\n" +
          processedCode.slice(closingBraceIndex);
      }
    }
  }

  // Replace {{USER_CODE}} placeholder with user's code
  const combinedCode = testHarness.replace("{{USER_CODE}}", processedCode);

  const token = await createSubmission({
    sourceCode: combinedCode,
    languageId: LANGUAGE_ID,
    compilerOptions: "-std=c++26",
  });

  // Poll for result
  let result: SubmissionResult;
  let attempts = 0;
  const maxAttempts = 30;

  do {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    result = await getSubmission(token);
    attempts++;
  } while (result.status.id <= 2 && attempts < maxAttempts); // 1=In Queue, 2=Processing

  const output = result.stdout?.trim() || null;
  // Status 3 = Accepted (ran successfully), check for "PASS" in output
  const passed = result.status.id === 3 && output === "PASS";

  return {
    passed,
    output,
    error: result.stderr || result.compile_output || result.message,
    time: result.time,
    memory: result.memory,
    status: result.status,
  };
}

export async function runCode(
  sourceCode: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<{
  passed: boolean;
  results: {
    input: string;
    expected: string;
    actual: string | null;
    passed: boolean;
    time: string | null;
    memory: number | null;
    error: string | null;
  }[];
}> {
  const results = [];
  let allPassed = true;

  for (const testCase of testCases) {
    const token = await createSubmission({
      sourceCode,
      languageId: LANGUAGE_ID,
      stdin: testCase.input,
      expectedOutput: testCase.expectedOutput,
      compilerOptions: "-std=c++26",
    });

    // Poll for result
    let result: SubmissionResult;
    let attempts = 0;
    const maxAttempts = 30;

    do {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await getSubmission(token);
      attempts++;
    } while (result.status.id <= 2 && attempts < maxAttempts); // 1=In Queue, 2=Processing

    const actualOutput = result.stdout?.trim() || null;
    const expected = testCase.expectedOutput.trim();
    const passed = actualOutput === expected && result.status.id === 3; // 3 = Accepted

    if (!passed) allPassed = false;

    results.push({
      input: testCase.input,
      expected,
      actual: actualOutput,
      passed,
      time: result.time,
      memory: result.memory,
      error: result.stderr || result.compile_output || result.message,
    });
  }

  return { passed: allPassed, results };
}
