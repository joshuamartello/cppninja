import { PrismaClient, Difficulty, ProblemType } from "@prisma/client";

const prisma = new PrismaClient();

const problems = [
  // Multiple Choice Problem from Stack Overflow
  {
    title: "Friend Function Visibility",
    slug: "friend-function-visibility",
    description: `
      <p>Consider the following C++ code where a friend function <code>example()</code> is called by another friend function <code>stuff()</code>:</p>
      <div class="code-block">
        <div class="code-block-header">
          <div class="dots">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
          </div>
          <span class="filename">thing.cpp</span>
        </div>
        <div class="code-block-content">
          <pre><code><span class="kw">class</span> <span class="ty">Thing</span> {
<span class="kw">public</span>:
    <span class="ty">Thing</span>(<span class="kw">int</span> i) : i(i) {}
    <span class="kw">friend</span> <span class="ty">Thing</span> <span class="fn">example</span>() {
        <span class="kw">return</span> <span class="nu">0</span>;
    }
    <span class="kw">friend</span> <span class="ty">Thing</span> <span class="fn">stuff</span>() {
        <span class="kw">return</span> <span class="fn">example</span>();
    }
<span class="kw">private</span>:
    <span class="kw">int</span> i;
};</code></pre>
        </div>
      </div>
      <p>The compiler reports: <code>error: 'example' was not declared in this scope</code></p>
      <p><strong>Why does this code fail to compile?</strong></p>
    `,
    difficulty: Difficulty.HARD,
    topics: ["Friend Functions", "Name Lookup", "ADL"],
    type: ProblemType.MULTIPLE_CHOICE,
    choices: [
      {
        id: "a",
        text: "Friend functions must be declared in order - example() needs to be defined before stuff() can call it",
      },
      {
        id: "b",
        text: "Friend functions defined inside a class are only visible via Argument-Dependent Lookup (ADL), and example() has no arguments involving Thing",
      },
      {
        id: "c",
        text: "You cannot call one friend function from another friend function within the same class",
      },
      {
        id: "d",
        text: "Friend functions require explicit namespace qualification when called from other functions",
      },
    ],
    correctAnswer: "b",
    explanation: `
      <p><strong>The correct answer is B.</strong></p>
      <p>Friend functions defined inside a class definition are <em>not</em> placed into the enclosing namespace for normal unqualified lookup. They are only "injected" into the namespace for the purposes of <strong>Argument-Dependent Lookup (ADL)</strong>.</p>
      <p>ADL only kicks in when a function call has arguments whose types are associated with a particular namespace or class. Since <code>example()</code> takes no arguments, ADL cannot find it.</p>
      <h4>Solutions:</h4>
      <ul>
        <li>Declare <code>example()</code> in the enclosing namespace before or after the class</li>
        <li>Make <code>example()</code> take a <code>Thing</code> parameter so ADL can find it</li>
        <li>Define the friend functions outside the class after declaring them inside</li>
      </ul>
      <p><strong>Working example:</strong></p>
      <div class="code-block">
        <div class="code-block-header">
          <div class="dots">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
          </div>
          <span class="filename">thing_fixed.cpp</span>
        </div>
        <div class="code-block-content">
          <pre><code><span class="kw">class</span> <span class="ty">Thing</span>;
<span class="ty">Thing</span> <span class="fn">example</span>();  <span class="cm">// Forward declaration in namespace</span>

<span class="kw">class</span> <span class="ty">Thing</span> {
<span class="kw">public</span>:
    <span class="ty">Thing</span>(<span class="kw">int</span> i) : i(i) {}
    <span class="kw">friend</span> <span class="ty">Thing</span> <span class="fn">example</span>() {
        <span class="kw">return</span> <span class="nu">0</span>;
    }
    <span class="kw">friend</span> <span class="ty">Thing</span> <span class="fn">stuff</span>() {
        <span class="kw">return</span> <span class="fn">example</span>();  <span class="cm">// Now works!</span>
    }
<span class="kw">private</span>:
    <span class="kw">int</span> i;
};</code></pre>
        </div>
      </div>
      <p><em>Source: <a href="https://stackoverflow.com/questions/79872601" target="_blank" rel="noopener">Stack Overflow</a></em></p>
    `,
  },
];

async function main() {
    // Multi-file linkage problem
    await prisma.problem.upsert({
      where: { slug: "internal-external-linkage" },
      update: {
        title: "Internal vs External Linkage",
        description: `<p>This problem tests your understanding of <strong>internal</strong> and <strong>external linkage</strong> in C++.</p>

<p>You are given two source files:</p>
<ul>
  <li><code>main.cpp</code> - The main program that needs to access a counter from another translation unit</li>
  <li><code>counter.cpp</code> - Defines the counter and helper functions</li>
</ul>

<h3>Your Task</h3>
<p>Fix the code so that:</p>
<ol>
  <li><code>shared_counter</code> in <code>counter.cpp</code> has <strong>external linkage</strong> and can be accessed from <code>main.cpp</code></li>
  <li><code>internal_counter</code> in <code>counter.cpp</code> has <strong>internal linkage</strong> and is only visible within <code>counter.cpp</code></li>
  <li>The program compiles, links, and outputs the expected result</li>
</ol>

<h3>Expected Output</h3>
<pre>shared: 10
internal (via function): 5</pre>

<h3>Hints</h3>
<ul>
  <li>Use <code>extern</code> to declare a variable defined in another translation unit</li>
  <li>Use <code>static</code> or an anonymous namespace for internal linkage</li>
  <li>Variables with internal linkage cannot be accessed directly from other translation units</li>
</ul>`,
        difficulty: "MEDIUM",
        topics: ["linkage", "translation units", "static", "extern"],
        type: "CODE_REVIEW",
        testType: "STDIN_STDOUT",
        starterCode: [
          {
            filename: "main.cpp",
            language: "cpp",
            code: `#include <iostream>

// TODO: Declare shared_counter from counter.cpp

// Function declared in counter.cpp
int get_internal_counter();

int main() {
    // TODO: Fix this to access shared_counter
    std::cout << "shared: " << shared_counter << std::endl;
    std::cout << "internal (via function): " << get_internal_counter() << std::endl;
}`
          },
          {
            filename: "counter.cpp",
            language: "cpp",
            code: `#include <iostream>

// TODO: Give this external linkage so main.cpp can access it
int shared_counter = 10;

// TODO: Give this internal linkage so only this file can access it
int internal_counter = 5;

int get_internal_counter() {
    return internal_counter;
}`
          }
        ],
        testCases: [
          {
            input: "",
            expectedOutput: "shared: 10\ninternal (via function): 5",
            isHidden: false
          }
        ],
        referenceSolution: `// main.cpp
#include <iostream>

extern int shared_counter;  // Declaration - defined in counter.cpp

int get_internal_counter();

int main() {
    std::cout << "shared: " << shared_counter << std::endl;
    std::cout << "internal (via function): " << get_internal_counter() << std::endl;
}

// counter.cpp
int shared_counter = 10;  // External linkage (default for non-const globals)

static int internal_counter = 5;  // Internal linkage - only visible in this TU

int get_internal_counter() {
    return internal_counter;
}`,
        explanation: `<h3>Solution Explanation</h3>

<p><strong>External Linkage</strong> (shared_counter):</p>
<ul>
  <li>By default, non-const global variables have external linkage</li>
  <li>In <code>main.cpp</code>, we use <code>extern int shared_counter;</code> to declare (not define) the variable</li>
  <li>This tells the compiler "this variable exists somewhere else"</li>
  <li>The linker resolves this to the definition in <code>counter.cpp</code></li>
</ul>

<p><strong>Internal Linkage</strong> (internal_counter):</p>
<ul>
  <li>Adding <code>static</code> gives a global variable internal linkage</li>
  <li>It's only visible within its translation unit (counter.cpp)</li>
  <li>Other files cannot access it directly, even with <code>extern</code></li>
  <li>We expose it indirectly through <code>get_internal_counter()</code></li>
</ul>

<p><strong>Alternative for internal linkage:</strong></p>
<pre><code>namespace {
    int internal_counter = 5;  // Anonymous namespace = internal linkage
}</code></pre>`,
      },
      create: {
        title: "Internal vs External Linkage",
        slug: "internal-external-linkage",
        description: `<p>This problem tests your understanding of <strong>internal</strong> and <strong>external linkage</strong> in C++.</p>

<p>You are given two source files:</p>
<ul>
  <li><code>main.cpp</code> - The main program that needs to access a counter from another translation unit</li>
  <li><code>counter.cpp</code> - Defines the counter and helper functions</li>
</ul>

<h3>Your Task</h3>
<p>Fix the code so that:</p>
<ol>
  <li><code>shared_counter</code> in <code>counter.cpp</code> has <strong>external linkage</strong> and can be accessed from <code>main.cpp</code></li>
  <li><code>internal_counter</code> in <code>counter.cpp</code> has <strong>internal linkage</strong> and is only visible within <code>counter.cpp</code></li>
  <li>The program compiles, links, and outputs the expected result</li>
</ol>

<h3>Expected Output</h3>
<pre>shared: 10
internal (via function): 5</pre>

<h3>Hints</h3>
<ul>
  <li>Use <code>extern</code> to declare a variable defined in another translation unit</li>
  <li>Use <code>static</code> or an anonymous namespace for internal linkage</li>
  <li>Variables with internal linkage cannot be accessed directly from other translation units</li>
</ul>`,
        difficulty: "MEDIUM",
        topics: ["linkage", "translation units", "static", "extern"],
        type: "CODE_REVIEW",
        testType: "STDIN_STDOUT",
        starterCode: [
          {
            filename: "main.cpp",
            language: "cpp",
            code: `#include <iostream>

// TODO: Declare shared_counter from counter.cpp

// Function declared in counter.cpp
int get_internal_counter();

int main() {
    // TODO: Fix this to access shared_counter
    std::cout << "shared: " << shared_counter << std::endl;
    std::cout << "internal (via function): " << get_internal_counter() << std::endl;
}`
          },
          {
            filename: "counter.cpp",
            language: "cpp",
            code: `#include <iostream>

// TODO: Give this external linkage so main.cpp can access it
int shared_counter = 10;

// TODO: Give this internal linkage so only this file can access it
int internal_counter = 5;

int get_internal_counter() {
    return internal_counter;
}`
          }
        ],
        testCases: [
          {
            input: "",
            expectedOutput: "shared: 10\ninternal (via function): 5",
            isHidden: false
          }
        ],
        referenceSolution: `// main.cpp
#include <iostream>

extern int shared_counter;  // Declaration - defined in counter.cpp

int get_internal_counter();

int main() {
    std::cout << "shared: " << shared_counter << std::endl;
    std::cout << "internal (via function): " << get_internal_counter() << std::endl;
}

// counter.cpp
int shared_counter = 10;  // External linkage (default for non-const globals)

static int internal_counter = 5;  // Internal linkage - only visible in this TU

int get_internal_counter() {
    return internal_counter;
}`,
        explanation: `<h3>Solution Explanation</h3>

<p><strong>External Linkage</strong> (shared_counter):</p>
<ul>
  <li>By default, non-const global variables have external linkage</li>
  <li>In <code>main.cpp</code>, we use <code>extern int shared_counter;</code> to declare (not define) the variable</li>
  <li>This tells the compiler "this variable exists somewhere else"</li>
  <li>The linker resolves this to the definition in <code>counter.cpp</code></li>
</ul>

<p><strong>Internal Linkage</strong> (internal_counter):</p>
<ul>
  <li>Adding <code>static</code> gives a global variable internal linkage</li>
  <li>It's only visible within its translation unit (counter.cpp)</li>
  <li>Other files cannot access it directly, even with <code>extern</code></li>
  <li>We expose it indirectly through <code>get_internal_counter()</code></li>
</ul>

<p><strong>Alternative for internal linkage:</strong></p>
<pre><code>namespace {
    int internal_counter = 5;  // Anonymous namespace = internal linkage
}</code></pre>`,
      }
    });

    await prisma.problem.upsert({
      where: { slug: "has-foo-method-concept" },
      update: {
        title: "Create HasFooMethod Concept",
        description: "Create a C++ concept that checks if a type has a foo() method.",
        difficulty: "MEDIUM",
        topics: ["concepts", "templates"],
        type: "CODE_REVIEW",
        testType: "UNIT_TEST",
        testHarness: `#include <iostream>
#include <concepts>

namespace NINJA_CODE {
struct ignorable {
    ignorable(...) {}
};

{{USER_CODE}}
} // namespace NINJA_CODE

struct TypeWithFoo { void foo() {} };
struct TypeWithoutFoo { int x; };

int main() {
    static_assert(NINJA_CODE::HasFooMethod<TypeWithFoo>);
    static_assert(!NINJA_CODE::HasFooMethod<TypeWithoutFoo>);
    std::cout << "PASS" << std::endl;
    return 0;
}`,
        starterCode: [{
          filename: "solution.cpp",
          language: "cpp",
          code: `#include <iostream>
#include <concepts>

template<typename T>
concept HasFooMethod = // implement

struct TypeWithFoo { void foo() {} };
struct TypeWithoutFoo { int x; };

int main() {
    static_assert(HasFooMethod<TypeWithFoo>);
    static_assert(!HasFooMethod<TypeWithoutFoo>);
}`
        }],
        referenceSolution: "template<typename T>\nconcept HasFooMethod = requires(T t) { t.foo(); };",
      },
      create: {
        title: "Create HasFooMethod Concept",
        slug: "has-foo-method-concept",
        description: "Create a C++ concept that checks if a type has a foo() method.",
        difficulty: "MEDIUM",
        topics: ["concepts", "templates"],
        type: "CODE_REVIEW",
        testType: "UNIT_TEST",
        testHarness: `#include <iostream>
#include <concepts>

namespace NINJA_CODE {
struct ignorable {
    ignorable(...) {}
};

{{USER_CODE}}
} // namespace NINJA_CODE

struct TypeWithFoo { void foo() {} };
struct TypeWithoutFoo { int x; };

int main() {
    static_assert(NINJA_CODE::HasFooMethod<TypeWithFoo>);
    static_assert(!NINJA_CODE::HasFooMethod<TypeWithoutFoo>);
    std::cout << "PASS" << std::endl;
    return 0;
}`,
        starterCode: [{
          filename: "solution.cpp",
          language: "cpp",
          code: `#include <iostream>
#include <concepts>

template<typename T>
concept HasFooMethod = // implement

struct TypeWithFoo { void foo() {} };
struct TypeWithoutFoo { int x; };

int main() {
    static_assert(HasFooMethod<TypeWithFoo>);
    static_assert(!HasFooMethod<TypeWithoutFoo>);
}`
        }],
        referenceSolution: "template<typename T>\nconcept HasFooMethod = requires(T t) { t.foo(); };",
      }
    });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
