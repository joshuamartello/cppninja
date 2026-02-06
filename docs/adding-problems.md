# Adding New Problems

This guide explains how to add new problems to the database using Prisma.

## Quick Start

1. Edit `prisma/seed.ts` to add your problem
2. Run `npx tsx prisma/seed.ts` to insert/update the problem
3. Visit the problem at `/problems/your-slug`

## Problem Types

### 1. Multiple Choice (`MULTIPLE_CHOICE`)

```typescript
await prisma.problem.upsert({
  where: { slug: "your-slug" },
  update: { /* same as create */ },
  create: {
    title: "Your Question Title",
    slug: "your-slug",  // URL-friendly, must be unique
    description: `<p>Your question in HTML format...</p>`,
    difficulty: "EASY",  // EASY | MEDIUM | HARD
    topics: ["topic1", "topic2"],
    type: "MULTIPLE_CHOICE",
    choices: [
      { id: "a", text: "First option" },
      { id: "b", text: "Second option" },
      { id: "c", text: "Third option" },
      { id: "d", text: "Fourth option" },
    ],
    correctAnswer: "b",  // ID of correct choice
    explanation: `<p>Explanation shown after answering...</p>`,
  }
});
```

### 2. Standard Code (`CODE` with `STDIN_STDOUT`)

Traditional problems where code reads from stdin and writes to stdout.

```typescript
await prisma.problem.upsert({
  where: { slug: "two-sum" },
  update: { /* same as create */ },
  create: {
    title: "Two Sum",
    slug: "two-sum",
    description: `<p>Given an array of integers...</p>`,
    difficulty: "EASY",
    topics: ["arrays", "hash-map"],
    type: "CODE",
    testType: "STDIN_STDOUT",  // Default, can be omitted
    starterCode: [{
      filename: "solution.cpp",
      language: "cpp",
      code: `#include <iostream>
using namespace std;

int main() {
    // Your code here
}`
    }],
    testCases: [
      { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isHidden: false },
      { input: "3\n3 2 4\n6", expectedOutput: "1 2", isHidden: false },
      { input: "2\n3 3\n6", expectedOutput: "0 1", isHidden: true },  // Hidden from user
    ],
    referenceSolution: `// Model solution...`,
    explanation: `<p>Explanation of the approach...</p>`,
  }
});
```

### 3. Compile-Time Testing (`CODE_REVIEW` with `UNIT_TEST`)

For testing C++ concepts, static_asserts, and template metaprogramming.

```typescript
await prisma.problem.upsert({
  where: { slug: "has-foo-concept" },
  update: { /* same as create */ },
  create: {
    title: "Create HasFoo Concept",
    slug: "has-foo-concept",
    description: `<p>Create a concept that checks for a foo() method...</p>`,
    difficulty: "MEDIUM",
    topics: ["concepts", "templates"],
    type: "CODE_REVIEW",
    testType: "UNIT_TEST",

    // Test harness - {{USER_CODE}} is replaced with user's submission
    testHarness: `#include <iostream>
#include <concepts>

namespace NINJA_CODE {
struct ignorable {
    ignorable(...) {}
};

{{USER_CODE}}
} // namespace NINJA_CODE

// Test fixtures (outside namespace - user can't modify)
struct HasFoo { void foo() {} };
struct NoFoo { int x; };

int main() {
    static_assert(NINJA_CODE::MyConcept<HasFoo>);
    static_assert(!NINJA_CODE::MyConcept<NoFoo>);
    std::cout << "PASS" << std::endl;
    return 0;
}`,

    // What user sees in editor
    starterCode: [{
      filename: "solution.cpp",
      language: "cpp",
      code: `#include <iostream>
#include <concepts>

template<typename T>
concept MyConcept = // implement

struct HasFoo { void foo() {} };
struct NoFoo { int x; };

int main() {
    static_assert(MyConcept<HasFoo>);
    static_assert(!MyConcept<NoFoo>);
}`
    }],

    referenceSolution: `template<typename T>
concept MyConcept = requires(T t) { t.foo(); };`,
  }
});
```

**How UNIT_TEST works:**
- User's code is wrapped in `NINJA_CODE` namespace
- If user has `int main()`, it's transformed to `ignorable main()` (becomes a no-op)
- Test harness's `main()` runs the actual tests
- Output must be exactly "PASS" for acceptance

### 4. Multi-File Problems

For problems requiring multiple translation units (e.g., linkage, separate compilation).

```typescript
await prisma.problem.upsert({
  where: { slug: "external-linkage" },
  update: { /* same as create */ },
  create: {
    title: "External Linkage",
    slug: "external-linkage",
    description: `<p>Fix the code to demonstrate external linkage...</p>`,
    difficulty: "MEDIUM",
    topics: ["linkage", "translation units"],
    type: "CODE_REVIEW",
    testType: "STDIN_STDOUT",  // Multi-file uses stdin/stdout testing

    // Multiple files - each becomes a separate translation unit
    starterCode: [
      {
        filename: "main.cpp",
        language: "cpp",
        code: `#include <iostream>

extern int counter;  // Declared here, defined elsewhere

int main() {
    std::cout << counter << std::endl;
}`
      },
      {
        filename: "data.cpp",
        language: "cpp",
        code: `// Definition with external linkage
int counter = 42;`
      }
    ],

    testCases: [
      { input: "", expectedOutput: "42", isHidden: false }
    ],
  }
});
```

**How multi-file works:**
- Each file is compiled as a separate translation unit
- Files are linked together
- Proper for testing: extern, static, ODR, linkage concepts

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Display title |
| `slug` | String | Yes | URL identifier (unique) |
| `description` | String | Yes | HTML description |
| `difficulty` | Enum | Yes | `EASY`, `MEDIUM`, `HARD` |
| `topics` | String[] | Yes | Array of topic tags |
| `type` | Enum | Yes | `CODE`, `MULTIPLE_CHOICE`, `CODE_REVIEW` |
| `testType` | Enum | No | `STDIN_STDOUT` (default), `UNIT_TEST` |
| `starterCode` | JSON | No | Array of `{filename, language, code}` |
| `testCases` | JSON | No | Array of `{input, expectedOutput, isHidden}` |
| `testHarness` | String | No | Test wrapper with `{{USER_CODE}}` placeholder |
| `choices` | JSON | No | For MULTIPLE_CHOICE: `{id, text}[]` |
| `correctAnswer` | String | No | For MULTIPLE_CHOICE: correct choice ID |
| `referenceSolution` | String | No | Model answer shown after submission |
| `explanation` | String | No | Explanation shown after answering |
| `hints` | JSON | No | Array of `{order, text}` for progressive hints |
| `category` | String | No | Sub-category (e.g., "modernization", "algorithms") |

## Using Upsert

Always use `upsert` so you can re-run the seed to update problems:

```typescript
await prisma.problem.upsert({
  where: { slug: "your-slug" },  // Unique identifier
  update: {
    // Fields to update if exists
    title: "Updated Title",
    description: "...",
    // ... all other fields
  },
  create: {
    // Fields for new record (must include slug)
    slug: "your-slug",
    title: "Updated Title",
    // ... all other fields
  }
});
```

## Running the Seed

```bash
# Add/update problems
npx tsx prisma/seed.ts

# If you modify the schema, regenerate client first
npm run db:generate
npm run db:push
npx tsx prisma/seed.ts
```

## Tips

1. **HTML in descriptions**: Use `<p>`, `<code>`, `<pre>`, `<ul>`, `<li>`, etc.
2. **Code blocks in descriptions**: Use the CSS classes from globals.css for styled code blocks
3. **Hidden test cases**: Set `isHidden: true` to hide input/output from users
4. **Escaping**: Use template literals (backticks) for multi-line strings
5. **Testing locally**: Run `npm run dev` and visit `/problems/your-slug`
