// ─────────────────────────────────────────────────────────────────────────────
// MasmSpace — Universal Multi-Language Code Execution Engine
// Supports C, C++, Java, JavaScript, TypeScript, C#, Python, Rust, Go, PHP, SQL
// With Real-time Auto-Iteration and Loop Trace Evaluation
// ─────────────────────────────────────────────────────────────────────────────

import { runPythonCode } from "@/lib/pyodideRunner";
import {
  type SupportedLanguage,
  type LanguageInfo,
  type ExecutionResult,
  type IterationStep,
  type CodeTemplate,
} from "@/types/codeRunner";

// ── Supported Languages Metadata ─────────────────────────────────────────────
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    id: "c",
    name: "C",
    badge: "C99/C11",
    icon: "🔵",
    fileExt: "c",
    description: "C Programming Language (Pointers, Memory, Loops)",
    defaultCode: `#include <stdio.h>

int main() {
    printf("=== C Loop Iteration ===\\n");
    for (int i = 1; i <= 6; i++) {
        printf("Iteration #%d: Value = %d, Square = %d\\n", i, i, i * i);
    }
    return 0;
}`,
  },
  {
    id: "cpp",
    name: "C++",
    badge: "C++20",
    icon: "🔷",
    fileExt: "cpp",
    description: "C++ (STL, Classes, Algorithms)",
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    cout << "=== C++ Star Pattern Iteration ===" << endl;
    for (int i = 1; i <= 5; i++) {
        for (int j = 1; j <= i; j++) {
            cout << "* ";
        }
        cout << endl;
    }
    return 0;
}`,
  },
  {
    id: "java",
    name: "Java",
    badge: "JDK 21",
    icon: "☕",
    fileExt: "java",
    description: "Java (OOP, Collections, Enterprise)",
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("=== Java Fibonacci Iteration ===");
        int a = 0, b = 1;
        for (int i = 1; i <= 8; i++) {
            System.out.println("Iteration " + i + ": Fibonacci = " + a);
            int next = a + b;
            a = b;
            b = next;
        }
    }
}`,
  },
  {
    id: "javascript",
    name: "JavaScript",
    badge: "ES2024",
    icon: "🟨",
    fileExt: "js",
    description: "Modern JavaScript (V8 Engine, Browser & Node)",
    defaultCode: `console.log("=== JavaScript Array Iteration ===");
const fruits = ["Apple 🍎", "Mango 🥭", "Banana 🍌", "Orange 🍊", "Grape 🍇"];

fruits.forEach((fruit, index) => {
    console.log(\`Iteration \${index + 1}: \${fruit}\`);
});`,
  },
  {
    id: "typescript",
    name: "TypeScript",
    badge: "TS 5.4",
    icon: "🔷",
    fileExt: "ts",
    description: "TypeScript with Type Annotations",
    defaultCode: `interface Student {
    id: number;
    name: string;
    marks: number;
}

const students: Student[] = [
    { id: 101, name: "Aarav", marks: 95 },
    { id: 102, name: "Diya", marks: 88 },
    { id: 103, name: "Kabir", marks: 92 }
];

console.log("=== TypeScript Student Iteration ===");
for (const s of students) {
    console.log(\`ID: \${s.id} | \${s.name} scored \${s.marks}% (Grade: A)\`);
}`,
  },
  {
    id: "csharp",
    name: "C#",
    badge: ".NET 8",
    icon: "🟣",
    fileExt: "cs",
    description: "C# (.NET, LINQ, Async/Await)",
    defaultCode: `using System;

class Program {
    static void Main() {
        Console.WriteLine("=== C# Countdown While Loop ===");
        int count = 5;
        while (count > 0) {
            Console.WriteLine($"Step {count}: Ready in {count}s...");
            count--;
        }
        Console.WriteLine("Liftoff! 🚀");
    }
}`,
  },
  {
    id: "python",
    name: "Python",
    badge: "Pyodide WASM",
    icon: "🐍",
    fileExt: "py",
    description: "Python 3 (Pyodide WebAssembly)",
    defaultCode: `print("=== Python Range & Math Iteration ===")

total = 0
for i in range(1, 7):
    total += i
    print(f"Iteration {i}: Running Sum = {total}")

print(f"\\nFinal Cumulative Sum: {total}")`,
  },
  {
    id: "sql",
    name: "SQL",
    badge: "In-Memory",
    icon: "🗄️",
    fileExt: "sql",
    description: "SQL Database Queries (Tables & Records)",
    defaultCode: `CREATE TABLE students (
    id INT,
    name VARCHAR(50),
    course VARCHAR(50),
    score INT
);

INSERT INTO students VALUES (1, 'Arjun', 'AI & ML', 94);
INSERT INTO students VALUES (2, 'Zara', 'Web Dev', 89);
INSERT INTO students VALUES (3, 'Rohan', 'Data Science', 96);

SELECT * FROM students WHERE score >= 90;`,
  },
  {
    id: "html",
    name: "HTML/CSS",
    badge: "Web Preview",
    icon: "🌐",
    fileExt: "html",
    description: "HTML5 & CSS3 Live Preview",
    defaultCode: `<div style="font-family: sans-serif; padding: 20px; background: #111420; color: #00f5ff; border-radius: 12px; border: 1px solid rgba(0,245,255,0.3);">
  <h2 style="margin: 0 0 10px 0;">✦ MasmSpace Live Code Component</h2>
  <p style="color: #cbd5e1; font-size: 14px;">Edit HTML and CSS to see live instant iteration updates!</p>
  <button style="padding: 8px 16px; background: #00f5ff; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
    Explore Whiteboard
  </button>
</div>`,
  },
  {
    id: "rust",
    name: "Rust",
    badge: "Rust 1.77",
    icon: "🦀",
    fileExt: "rs",
    description: "Rust (Memory Safety, Concurrency)",
    defaultCode: `fn main() {
    println!("=== Rust For Loop Iteration ===");
    for i in 1..=5 {
        println!("Iteration {}: Factorial base = {}", i, i * 2);
    }
}`,
  },
  {
    id: "go",
    name: "Go",
    badge: "Go 1.22",
    icon: "🐹",
    fileExt: "go",
    description: "Go (Golang - Fast, Concurrent)",
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("=== Go Loop Iteration ===")
    for i := 1; i <= 5; i++ {
        fmt.Printf("Step %d: Value = %d\\n", i, i*10)
    }
}`,
  },
  {
    id: "php",
    name: "PHP",
    badge: "PHP 8.3",
    icon: "🐘",
    fileExt: "php",
    description: "PHP (Server-side Scripting)",
    defaultCode: `<?php
echo "=== PHP Loop Iteration ===\\n";
for ($i = 1; $i <= 5; $i++) {
    echo "Iteration $i: Hello from PHP!\\n";
}
?>`,
  },
];

// ── Multi-Language Templates Specially Tailored for Iterations & Loops ────────
export const MULTI_LANG_TEMPLATES: Record<SupportedLanguage, CodeTemplate[]> = {
  c: [
    {
      id: "c-for-loop",
      name: "🔄 For Loop (1 to 10 & Squares)",
      category: "Algorithm",
      description: "Basic for loop counter iterating from 1 to 10",
      code: `#include <stdio.h>

int main() {
    printf("=== C For Loop Iteration ===\\n");
    for (int i = 1; i <= 10; i++) {
        printf("Iteration %2d: Square = %3d | Cube = %4d\\n", i, i * i, i * i * i);
    }
    return 0;
}`,
    },
    {
      id: "c-star-pattern",
      name: "⭐ Nested Loop Star Pyramid",
      category: "Algorithm",
      description: "Nested loops printing a triangle star pattern",
      code: `#include <stdio.h>

int main() {
    int rows = 6;
    printf("=== Star Pattern Nested Loops ===\\n");
    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= i; j++) {
            printf("* ");
        }
        printf("\\n");
    }
    return 0;
}`,
    },
    {
      id: "c-while-loop",
      name: "🌀 While Loop Countdown",
      category: "Algorithm",
      description: "While loop iterating until condition breaks",
      code: `#include <stdio.h>

int main() {
    int count = 5;
    printf("=== While Loop Iteration ===\\n");
    while (count > 0) {
        printf("Timer: %d seconds remaining...\\n", count);
        count--;
    }
    printf("Times up! Loop finished.\\n");
    return 0;
}`,
    },
    {
      id: "c-array-sum",
      name: "🔢 Array Iteration & Sum",
      category: "Data",
      description: "Iterating through an array to compute sum and average",
      code: `#include <stdio.h>

int main() {
    int scores[] = {85, 92, 78, 96, 88};
    int n = 5;
    int sum = 0;

    printf("=== Array Element Iteration ===\\n");
    for (int i = 0; i < n; i++) {
        printf("Item [%d] = %d\\n", i, scores[i]);
        sum += scores[i];
    }

    printf("\\nTotal Sum = %d\\n", sum);
    printf("Average   = %.2f\\n", (float)sum / n);
    return 0;
}`,
    },
  ],

  cpp: [
    {
      id: "cpp-multiplication",
      name: "🔄 Multiplication Table (1 to 10)",
      category: "Math",
      description: "Generate multiplication table using iteration",
      code: `#include <iostream>
using namespace std;

int main() {
    int num = 7;
    cout << "=== Multiplication Table of " << num << " ===" << endl;
    for (int i = 1; i <= 10; i++) {
        cout << num << " x " << i << " = " << (num * i) << endl;
    }
    return 0;
}`,
    },
    {
      id: "cpp-pattern",
      name: "📐 Inverted Number Pyramid",
      category: "Algorithm",
      description: "Nested loops printing inverted numbers",
      code: `#include <iostream>
using namespace std;

int main() {
    int n = 5;
    cout << "=== Inverted Pyramid Iteration ===" << endl;
    for (int i = n; i >= 1; i--) {
        for (int j = 1; j <= i; j++) {
            cout << j << " ";
        }
        cout << endl;
    }
    return 0;
}`,
    },
    {
      id: "cpp-fibonacci",
      name: "🧬 Fibonacci Series Iteration",
      category: "Algorithm",
      description: "Iterative Fibonacci sequence calculation",
      code: `#include <iostream>
using namespace std;

int main() {
    int n = 10;
    long long t1 = 0, t2 = 1, nextTerm = 0;

    cout << "=== First " << n << " Fibonacci Numbers ===" << endl;
    for (int i = 1; i <= n; ++i) {
        if (i == 1) {
            cout << "Step 1: " << t1 << endl;
            continue;
        }
        if (i == 2) {
            cout << "Step 2: " << t2 << endl;
            continue;
        }
        nextTerm = t1 + t2;
        t1 = t2;
        t2 = nextTerm;
        cout << "Step " << i << ": " << nextTerm << endl;
    }
    return 0;
}`,
    },
  ],

  java: [
    {
      id: "java-even-odd",
      name: "🔄 Even & Odd Loop Filter",
      category: "Algorithm",
      description: "Classify numbers 1 to 20 as even or odd",
      code: `public class Main {
    public static void main(String[] args) {
        System.out.println("=== Java Even & Odd Numbers ===");
        for (int i = 1; i <= 12; i++) {
            if (i % 2 == 0) {
                System.out.println("Number " + i + " -> EVEN");
            } else {
                System.out.println("Number " + i + " -> ODD");
            }
        }
    }
}`,
    },
    {
      id: "java-factorial",
      name: "🧮 Factorial Calculator",
      category: "Math",
      description: "Iterative calculation of factorial",
      code: `public class Main {
    public static void main(String[] args) {
        int n = 6;
        long fact = 1;
        System.out.println("=== Factorial Calculation of " + n + "! ===");
        for (int i = 1; i <= n; i++) {
            fact *= i;
            System.out.println("Step " + i + ": " + fact);
        }
        System.out.println("\\nResult: " + n + "! = " + fact);
    }
}`,
    },
    {
      id: "java-array-max",
      name: "📊 Array Maximum Search",
      category: "Data",
      description: "Find max element using array iteration",
      code: `public class Main {
    public static void main(String[] args) {
        int[] numbers = {14, 58, 29, 93, 47, 81};
        int max = numbers[0];

        System.out.println("=== Finding Maximum in Array ===");
        for (int i = 0; i < numbers.length; i++) {
            System.out.println("Examining index " + i + " -> value: " + numbers[i]);
            if (numbers[i] > max) {
                max = numbers[i];
            }
        }
        System.out.println("\\nMaximum Element Found: " + max);
    }
}`,
    },
  ],

  javascript: [
    {
      id: "js-array-methods",
      name: "🔄 Array Map & Filter Iteration",
      category: "Algorithm",
      description: "Modern JavaScript functional array loops",
      code: `console.log("=== JavaScript Functional Iterations ===");

const numbers = [1, 2, 3, 4, 5, 6, 7, 8];

// Map: Double each value
const doubled = numbers.map(x => x * 2);
console.log("Doubled values:", doubled);

// Filter: Evens only
const evens = numbers.filter(x => x % 2 === 0);
console.log("Even numbers:", evens);

// Reduce: Total sum
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
console.log("Total sum:", sum);`,
    },
    {
      id: "js-object-loop",
      name: "⚡ Object Keys & Values Iteration",
      category: "Data",
      description: "Iterate over object entries",
      code: `const userProfile = {
    username: "coder_pro",
    role: "FullStack Developer",
    rank: "Diamond",
    solvedProblems: 142,
    rating: 4.9
};

console.log("=== Object Entries Iteration ===");
for (const [key, value] of Object.entries(userProfile)) {
    console.log(\`Key: \${key.padEnd(15)} => Value: \${value}\`);
}`,
    },
  ],

  typescript: [
    {
      id: "ts-typed-iteration",
      name: "🔄 Typed Records Iteration",
      category: "Algorithm",
      description: "Type-safe iterations over typed collections",
      code: `interface Course {
    id: string;
    title: string;
    modules: number;
    completed: boolean;
}

const curriculum: Course[] = [
    { id: "CS101", title: "C & Algorithms", modules: 12, completed: true },
    { id: "CS102", title: "Data Structures in C++", modules: 16, completed: true },
    { id: "CS103", title: "Java & Systems", modules: 14, completed: false },
    { id: "CS104", title: "Web Architecture with Next.js", modules: 20, completed: false }
];

console.log("=== TypeScript Curriculum Iteration ===");
curriculum.forEach((course, idx) => {
    const status = course.completed ? "✅ COMPLETED" : "⏳ IN PROGRESS";
    console.log(\`#\${idx + 1} [\${course.id}] \${course.title} (\${course.modules} mods) - \${status}\`);
});`,
    },
  ],

  csharp: [
    {
      id: "cs-for-loop",
      name: "🔄 C# For Loop & String Interpolation",
      category: "Algorithm",
      description: "Standard C# for loop with interpolation",
      code: `using System;

class Program {
    static void Main() {
        Console.WriteLine("=== C# For Loop Iteration ===");
        for (int i = 1; i <= 6; i++) {
            Console.WriteLine($"Iteration {i}: Factorial base = {i * 10}");
        }
    }
}`,
    },
  ],

  python: [
    {
      id: "py-range-loop",
      name: "🔄 Range Loop & Squares",
      category: "Math",
      description: "Python range loop with step",
      code: `print("=== Python Range Iteration ===")
for i in range(1, 11):
    print(f"Iteration {i:2d} -> Square = {i**2:3d} | Cube = {i**3:4d}")`,
    },
    {
      id: "py-nested-pattern",
      name: "⭐ Nested Loops Number Triangle",
      category: "Algorithm",
      description: "Nested loops generating a number triangle",
      code: `print("=== Number Pyramid Iteration ===")
rows = 5
for i in range(1, rows + 1):
    for j in range(1, i + 1):
        print(j, end=" ")
    print()`,
    },
  ],

  sql: [
    {
      id: "sql-students",
      name: "🗄️ Students Table & Filter",
      category: "Data",
      description: "Create table, insert records, and query",
      code: `CREATE TABLE students (
    id INT,
    name VARCHAR(50),
    course VARCHAR(50),
    score INT
);

INSERT INTO students VALUES (1, 'Arjun', 'AI & ML', 94);
INSERT INTO students VALUES (2, 'Zara', 'Web Dev', 89);
INSERT INTO students VALUES (3, 'Rohan', 'Data Science', 96);
INSERT INTO students VALUES (4, 'Priya', 'Cloud Computing', 91);

SELECT * FROM students WHERE score >= 90;`,
    },
  ],

  html: [
    {
      id: "html-card",
      name: "🌐 Live Glassmorphism Card",
      category: "MasmSpace Canvas",
      description: "Interactive HTML/CSS preview card",
      code: `<div style="font-family: sans-serif; padding: 24px; background: linear-gradient(135deg, #0d1117, #161b22); color: #00f5ff; border-radius: 16px; border: 1px solid rgba(0,245,255,0.25); box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
  <h2 style="margin: 0 0 8px 0; font-size: 20px;">✦ MasmSpace Live Preview</h2>
  <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">
    Any HTML/CSS you type iterates live in real-time right here!
  </p>
  <div style="display: flex; gap: 8px;">
    <button style="padding: 8px 16px; background: #00f5ff; color: #000; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">
      Run Simulation
    </button>
    <button style="padding: 8px 16px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer;">
      Documentation
    </button>
  </div>
</div>`,
    },
  ],

  rust: [
    {
      id: "rs-range",
      name: "🔄 Rust Range Iteration",
      category: "Algorithm",
      description: "Looping through range in Rust",
      code: `fn main() {
    println!("=== Rust Range Iteration ===");
    for i in 1..=6 {
        println!("Iteration {}: Cube = {}", i, i * i * i);
    }
}`,
    },
  ],

  go: [
    {
      id: "go-loop",
      name: "🔄 Go For Loop Iteration",
      category: "Algorithm",
      description: "Standard Go loop iteration",
      code: `package main

import "fmt"

func main() {
    fmt.Println("=== Go Iteration Counter ===")
    for i := 1; i <= 6; i++ {
        fmt.Printf("Step %d: Value = %d\\n", i, i * 5)
    }
}`,
    },
  ],

  php: [
    {
      id: "php-loop",
      name: "🔄 PHP Loop Iteration",
      category: "Algorithm",
      description: "PHP for loop with step counter",
      code: `<?php
echo "=== PHP Loop Counter ===\\n";
for ($i = 1; $i <= 6; $i++) {
    echo "Iteration $i: Hello MasmSpace!\\n";
}
?>`,
    },
  ],
};

// ── C / C++ / Java / C# Transpilation & Execution Engine ──────────────────────
function transpileToJS(code: string, language: SupportedLanguage): string {
  let js = code;

  // 1. Remove comments and preprocessors
  const lines = js.split("\n").map((line) => {
    if (
      /^\s*#include/i.test(line) ||
      /^\s*using\s+namespace/i.test(line) ||
      /^\s*using\s+System/i.test(line) ||
      /^\s*package\s+/i.test(line) ||
      /^\s*import\s+/i.test(line)
    ) {
      return "";
    }
    if (/^\s*<\?php/i.test(line) || /^\s*\?>/i.test(line)) {
      return "";
    }
    return line;
  });
  js = lines.join("\n");

  // 2. Wrap Java / C# Class wrappers
  js = js.replace(/public\s+class\s+\w+\s*\{/g, "");
  js = js.replace(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{/g, "");
  js = js.replace(/class\s+\w+\s*\{/g, "");
  js = js.replace(/static\s+void\s+Main\s*\([^)]*\)\s*\{/g, "");

  // 3. Remove C/C++ "int main(...) {" or "void main(...) {"
  js = js.replace(/(?:int|void)\s+main\s*\([^)]*\)\s*\{/g, "");
  js = js.replace(/fn\s+main\s*\([^)]*\)\s*\{/g, "");
  js = js.replace(/func\s+main\s*\([^)]*\)\s*\{/g, "");

  // 4. Transform Output Statements
  js = js.replace(/System\.out\.println\s*\(/g, "__printLine(");
  js = js.replace(/System\.out\.print\s*\(/g, "__print(");
  js = js.replace(/System\.out\.printf\s*\(/g, "__printf(");

  js = js.replace(/Console\.WriteLine\s*\(\$?"/g, '__printInterpolated("');
  js = js.replace(/Console\.WriteLine\s*\(/g, "__printLine(");
  js = js.replace(/Console\.Write\s*\(/g, "__print(");

  js = js.replace(/\bprintf\s*\(/g, "__printf(");
  js = js.replace(/\bputs\s*\(/g, "__printLine(");

  js = js.replace(/fmt\.Println\s*\(/g, "__printLine(");
  js = js.replace(/fmt\.Printf\s*\(/g, "__printf(");

  js = js.replace(/println!\s*\(/g, "__printRust(");
  js = js.replace(/print!\s*\(/g, "__print(");

  js = js.replace(/\becho\s+(.*?);/g, "__printLine($1);");
  js = js.replace(/\bprint\s+(.*?);/g, "__printLine($1);");

  // C++ cout << a << b << endl;
  js = js.replace(/cout\s*<<\s*(.*?);/g, (_, stream) => {
    const parts = stream.split("<<").map((p: string) => {
      const trimmed = p.trim();
      if (trimmed === "endl") return '"\\n"';
      return trimmed;
    });
    return `__printStream(${parts.join(", ")});`;
  });

  // 5. Types replacement: int, float, double, char, long, bool, var, auto, let mut -> let
  js = js.replace(/\b(?:int|float|double|char|long|bool|auto|var)\b/g, "let");
  js = js.replace(/\blet\s+mut\b/g, "let");
  js = js.replace(/\b(\w+)\s*:=\s*/g, "let $1 = ");

  // 6. C/Java Arrays
  js = js.replace(/let\[\]\s+(\w+)\s*=\s*\{([^}]*)\}/g, "let $1 = [$2]");
  js = js.replace(/let\s+(\w+)\[\]\s*=\s*\{([^}]*)\}/g, "let $1 = [$2]");
  js = js.replace(/let\s+(\w+)\[\]\s*=\s*new\s+let\[\]\s*\{([^}]*)\}/g, "let $1 = [$2]");

  // 7. Rust range
  js = js.replace(/for\s+(\w+)\s+in\s+(\d+)\.\.=(\d+)\s*\{/g, "for (let $1 = $2; $1 <= $3; $1++) {");
  js = js.replace(/for\s+(\w+)\s+in\s+(\d+)\.\.(\d+)\s*\{/g, "for (let $1 = $2; $1 < $3; $1++) {");

  // 8. Remove PHP dollar signs
  if (language === "php") {
    js = js.replace(/\$(\w+)/g, "$1");
  }

  // 9. Remove "return 0;"
  js = js.replace(/return\s+0\s*;/g, "");

  // 10. Clean up trailing braces
  const openBraces = (js.match(/\{/g) || []).length;
  let closeBraces = (js.match(/\}/g) || []).length;
  while (closeBraces > openBraces && js.lastIndexOf("}") !== -1) {
    const lastIndex = js.lastIndexOf("}");
    js = js.substring(0, lastIndex) + js.substring(lastIndex + 1);
    closeBraces--;
  }

  return js;
}

// ── In-Memory SQL Runner ──────────────────────────────────────────────────────
function runSQLQuery(sql: string): { stdout: string; error: string | null } {
  try {
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const tables: Record<string, { columns: string[]; rows: any[] }> = {};
    const outputLines: string[] = [];

    for (const stmt of statements) {
      const createMatch = stmt.match(/create\s+table\s+(\w+)\s*\(([\s\S]*?)\)/i);
      if (createMatch) {
        const tableName = createMatch[1].toLowerCase();
        const cols = createMatch[2]
          .split(",")
          .map((c) => c.trim().split(/\s+/)[0]);
        tables[tableName] = { columns: cols, rows: [] };
        outputLines.push(`✓ Table '${tableName}' created with columns: [${cols.join(", ")}]`);
        continue;
      }

      const insertMatch = stmt.match(/insert\s+into\s+(\w+)\s*(?:\([^)]*\))?\s*values\s*\(([\s\S]*?)\)/i);
      if (insertMatch) {
        const tableName = insertMatch[1].toLowerCase();
        if (!tables[tableName]) {
          return { stdout: "", error: `Table '${tableName}' does not exist.` };
        }
        const vals = insertMatch[2].split(",").map((v) => {
          const trimmed = v.trim();
          if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
            return trimmed.slice(1, -1);
          }
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1);
          }
          const num = Number(trimmed);
          return isNaN(num) ? trimmed : num;
        });
        tables[tableName].rows.push(vals);
        outputLines.push(`✓ 1 row inserted into '${tableName}'`);
        continue;
      }

      const selectMatch = stmt.match(/select\s+(.*?)\s+from\s+(\w+)(?:\s+where\s+(.*?))?$/i);
      if (selectMatch) {
        const tableName = selectMatch[2].toLowerCase();
        if (!tables[tableName]) {
          return { stdout: "", error: `Table '${tableName}' does not exist.` };
        }

        const table = tables[tableName];
        let rows = table.rows;

        const whereClause = selectMatch[3];
        if (whereClause) {
          const condMatch = whereClause.match(/(\w+)\s*(=|>=|<=|>|<|!=)\s*(.*)/);
          if (condMatch) {
            const colName = condMatch[1].toLowerCase();
            const colIdx = table.columns.findIndex((c) => c.toLowerCase() === colName);
            const op = condMatch[2];
            const rawVal = condMatch[3].trim().replace(/^['"]|['"]$/g, "");
            const val = isNaN(Number(rawVal)) ? rawVal : Number(rawVal);

            if (colIdx !== -1) {
              rows = rows.filter((r) => {
                const cell = r[colIdx];
                switch (op) {
                  case "=":
                    return cell == val;
                  case ">":
                    return cell > val;
                  case ">=":
                    return cell >= val;
                  case "<":
                    return cell < val;
                  case "<=":
                    return cell <= val;
                  case "!=":
                    return cell != val;
                  default:
                    return true;
                }
              });
            }
          }
        }

        outputLines.push(`\n=== Query Result: '${tableName}' (${rows.length} rows) ===`);
        const header = "| " + table.columns.map((c) => c.padEnd(14)).join(" | ") + " |";
        const divider = "+-" + table.columns.map(() => "-".repeat(14)).join("-+-") + "-+";
        outputLines.push(divider);
        outputLines.push(header);
        outputLines.push(divider);

        for (const row of rows) {
          const rowStr = "| " + row.map((cell: any) => String(cell).padEnd(14)).join(" | ") + " |";
          outputLines.push(rowStr);
        }
        outputLines.push(divider);
        continue;
      }

      outputLines.push(`Query executed: ${stmt}`);
    }

    return { stdout: outputLines.join("\n"), error: null };
  } catch (err: any) {
    return { stdout: "", error: err.message || "SQL Syntax Error" };
  }
}

// ── Main Universal Code Execution Function ────────────────────────────────────
export async function executeUniversalCode(
  code: string,
  language: SupportedLanguage,
  onStatusUpdate?: (status: string) => void
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  // 1. Python (via Pyodide WASM)
  if (language === "python") {
    try {
      onStatusUpdate?.("Executing in Pyodide WebAssembly sandbox...");
      const pyRes = await runPythonCode(code, onStatusUpdate);
      const executionTimeMs = Math.round(performance.now() - startTime);

      const matches = pyRes.stdout.match(/iteration|step|count/gi);
      const iterationCount = matches ? matches.length : undefined;

      return {
        stdout: pyRes.stdout,
        stderr: pyRes.stderr,
        returnValue: pyRes.returnValue,
        executionTimeMs,
        error: pyRes.error,
        timestamp,
        iterationCount,
        language: "python",
      };
    } catch (err: any) {
      return {
        stdout: "",
        stderr: err.message || String(err),
        returnValue: null,
        executionTimeMs: Math.round(performance.now() - startTime),
        error: err.message || "Python Execution Failed",
        timestamp,
        language: "python",
      };
    }
  }

  // 2. HTML / CSS Live Preview
  if (language === "html") {
    return {
      stdout: code,
      stderr: "",
      returnValue: "HTML/CSS Live Component Ready",
      executionTimeMs: 1,
      error: null,
      timestamp,
      language: "html",
    };
  }

  // 3. SQL In-Memory Engine
  if (language === "sql") {
    const { stdout, error } = runSQLQuery(code);
    return {
      stdout,
      stderr: error || "",
      returnValue: error ? null : "Query executed successfully",
      executionTimeMs: Math.round(performance.now() - startTime),
      error,
      timestamp,
      language: "sql",
    };
  }

  // 4. JavaScript, TypeScript, C, C++, Java, C#, Rust, Go, PHP
  return new Promise<ExecutionResult>((resolve) => {
    try {
      onStatusUpdate?.(`Running ${language.toUpperCase()} execution sandbox...`);

      const outputLogs: string[] = [];
      const steps: IterationStep[] = [];
      let stepCount = 0;

      const __printLine = (...args: any[]) => {
        const text = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
        outputLogs.push(text);

        const match = text.match(/(?:iteration|step|count)\s*#?(\d+)/i);
        if (match) {
          stepCount++;
          steps.push({
            step: Number(match[1]) || stepCount,
            variable: "Output",
            value: text,
            output: text,
          });
        }
      };

      const __print = (...args: any[]) => {
        const text = args.map((a) => String(a)).join("");
        if (outputLogs.length > 0 && !outputLogs[outputLogs.length - 1].endsWith("\n")) {
          outputLogs[outputLogs.length - 1] += text;
        } else {
          outputLogs.push(text);
        }
      };

      const __printStream = (...args: any[]) => {
        const text = args.map((a) => String(a)).join("");
        outputLogs.push(text);
      };

      const __printf = (format: string, ...args: any[]) => {
        let argIdx = 0;
        const formatted = String(format).replace(/%(-?\d+)?(?:\.\d+)?[dfsc%]/g, (match) => {
          if (match === "%%") return "%";
          if (argIdx >= args.length) return match;
          const val = args[argIdx++];
          if (match.endsWith("d")) return String(parseInt(val, 10));
          if (match.endsWith("f")) return String(parseFloat(val).toFixed(2));
          return String(val);
        });

        const parts = formatted.split("\n");
        for (let i = 0; i < parts.length; i++) {
          if (i === 0 && outputLogs.length > 0 && !outputLogs[outputLogs.length - 1].endsWith("\n")) {
            outputLogs[outputLogs.length - 1] += parts[i];
          } else if (parts[i].length > 0 || i < parts.length - 1) {
            outputLogs.push(parts[i]);
          }
        }

        const iterMatch = formatted.match(/(?:iteration|step|count)\s*#?(\d+)/i);
        if (iterMatch) {
          stepCount++;
          steps.push({
            step: Number(iterMatch[1]) || stepCount,
            variable: "Formatted",
            value: formatted.trim(),
            output: formatted.trim(),
          });
        }
      };

      const __printInterpolated = (str: string) => {
        __printLine(str);
      };

      const __printRust = (format: string, ...args: any[]) => {
        let argIdx = 0;
        const formatted = format.replace(/\{\}/g, () => {
          return argIdx < args.length ? String(args[argIdx++]) : "{}";
        });
        __printLine(formatted);
      };

      const sandboxConsole = {
        log: __printLine,
        info: __printLine,
        warn: __printLine,
        error: __printLine,
      };

      let executableCode: string;
      if (language === "javascript") {
        executableCode = code;
      } else if (language === "typescript") {
        executableCode = code
          .replace(/:\s*(?:string|number|boolean|any|void|unknown|never|Record<[^>]+>|[A-Z]\w*(?:\[\])?)\b/g, "")
          .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "")
          .replace(/type\s+\w+\s*=[\s\S]*?;/g, "")
          .replace(/as\s+[A-Z]\w*/g, "");
      } else {
        executableCode = transpileToJS(code, language);
      }

      let loopCheckCount = 0;
      const MAX_ITERATIONS = 10000;
      const __checkLoop = () => {
        loopCheckCount++;
        if (loopCheckCount > MAX_ITERATIONS) {
          throw new Error(`Infinite loop detected! Exceeded ${MAX_ITERATIONS} iterations.`);
        }
      };

      const runFn = new Function(
        "console",
        "__printLine",
        "__print",
        "__printStream",
        "__printf",
        "__printInterpolated",
        "__printRust",
        "__checkLoop",
        `
        "use strict";
        try {
          ${executableCode}
        } catch (e) {
          throw e;
        }
        `
      );

      const resVal = runFn(
        sandboxConsole,
        __printLine,
        __print,
        __printStream,
        __printf,
        __printInterpolated,
        __printRust,
        __checkLoop
      );

      const executionTimeMs = Math.max(1, Math.round(performance.now() - startTime));
      const fullStdout = outputLogs.join("\n");

      const loopMatchCount = (fullStdout.match(/\n/g) || []).length + 1;
      const iterationCount = steps.length > 0 ? steps.length : loopMatchCount > 1 ? loopMatchCount : undefined;

      resolve({
        stdout: fullStdout,
        stderr: "",
        returnValue: resVal !== undefined ? String(resVal) : null,
        executionTimeMs,
        error: null,
        timestamp,
        iterationCount,
        steps: steps.length > 0 ? steps : undefined,
        language,
      });
    } catch (err: any) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      resolve({
        stdout: "",
        stderr: err.message || String(err),
        returnValue: null,
        executionTimeMs,
        error: err.message || `${language.toUpperCase()} Execution Error`,
        timestamp,
        language,
      });
    }
  });
}
