// ─────────────────────────────────────────────────────────────────────────────
// MasmSpace — Pyodide WebAssembly Client
// Secure, 100% in-browser Python execution via WebAssembly
// ─────────────────────────────────────────────────────────────────────────────

import { type PyodideExecutionResult, type CodeTemplate } from "@/types/codeRunner";

// Declare Pyodide global types on window
declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    pyodideInstance?: any;
    pyodideLoadingPromise?: Promise<any>;
  }
}

const PYODIDE_CDN_VERSION = "v0.26.4";
const PYODIDE_JS_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_CDN_VERSION}/full/pyodide.js`;
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_CDN_VERSION}/full/`;

/**
 * Dynamically injects Pyodide script tag if not yet present
 */
function loadPyodideScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide can only run in browser environments"));
  }

  if (window.loadPyodide) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${PYODIDE_JS_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", (e) =>
        reject(new Error(`Failed to load Pyodide script: ${e}`))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PYODIDE_JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Pyodide script from CDN. Check network connection."));
    document.head.appendChild(script);
  });
}

/**
 * Initializes and caches the singleton Pyodide WebAssembly runtime
 */
export async function getPyodideInstance(
  onStatusUpdate?: (statusText: string) => void
): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Pyodide is only supported in browser contexts");
  }

  if (window.pyodideInstance) {
    return window.pyodideInstance;
  }

  if (window.pyodideLoadingPromise) {
    return window.pyodideLoadingPromise;
  }

  window.pyodideLoadingPromise = (async () => {
    onStatusUpdate?.("Loading Pyodide WebAssembly script...");
    await loadPyodideScript();

    if (!window.loadPyodide) {
      throw new Error("Pyodide script loaded, but window.loadPyodide was not defined.");
    }

    onStatusUpdate?.("Initializing Python WebAssembly runtime...");
    const pyodide = await window.loadPyodide({
      indexURL: PYODIDE_INDEX_URL,
    });

    window.pyodideInstance = pyodide;
    onStatusUpdate?.("Python WebAssembly ready!");
    return pyodide;
  })();

  return window.pyodideLoadingPromise;
}

/**
 * Executes Python code safely in Pyodide WebAssembly and captures stdout, stderr, and return value.
 */
export async function runPythonCode(
  code: string,
  onStatusUpdate?: (statusText: string) => void
): Promise<PyodideExecutionResult> {
  const startTime = performance.now();
  const stdoutLogs: string[] = [];
  const stderrLogs: string[] = [];

  try {
    const pyodide = await getPyodideInstance(onStatusUpdate);

    // Setup stdout and stderr listeners
    pyodide.setStdout({
      batched: (text: string) => {
        stdoutLogs.push(text);
      },
    });

    pyodide.setStderr({
      batched: (text: string) => {
        stderrLogs.push(text);
      },
    });

    // Execute the user code asynchronously
    const rawResult = await pyodide.runPythonAsync(code);

    let returnValue: string | null = null;
    if (rawResult !== undefined && rawResult !== null) {
      if (typeof rawResult.toJs === "function") {
        try {
          const jsVal = rawResult.toJs();
          returnValue = JSON.stringify(jsVal, null, 2);
          rawResult.destroy?.();
        } catch {
          returnValue = String(rawResult);
        }
      } else {
        returnValue = String(rawResult);
      }
    }

    const elapsed = Math.round(performance.now() - startTime);

    return {
      stdout: stdoutLogs.join("\n"),
      stderr: stderrLogs.join("\n"),
      returnValue,
      executionTimeMs: elapsed,
      error: null,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - startTime);
    const errorMessage = err?.message || String(err);

    return {
      stdout: stdoutLogs.join("\n"),
      stderr: stderrLogs.join("\n"),
      returnValue: null,
      executionTimeMs: elapsed,
      error: errorMessage,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}

/**
 * Built-in curated Python templates for the whiteboard
 */
export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: "welcome",
    name: "👋 Welcome & System Info",
    category: "Algorithm",
    description: "Inspect browser Python WebAssembly environment",
    code: `# ✦ MasmSpace Code-on-Board ✦
# Local Python WebAssembly (Pyodide v0.26)
import sys
import platform

print("🐍 Python Version:", sys.version.split()[0])
print("⚡ Architecture: WebAssembly (WASM)")
print("🔒 Security: 100% Client-Side Sandbox (No Server Required)")

# Simple computation
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = [x for x in numbers if x % 2 == 0]
print(f"\\nEven numbers: {evens}")
print(f"Sum of squares: {sum(x**2 for x in evens)}")
`,
  },
  {
    id: "fibonacci",
    name: "🔢 Fibonacci & Golden Ratio",
    category: "Algorithm",
    description: "Generate Fibonacci sequence with golden ratio convergence",
    code: `# Fibonacci generator with ratio analysis
def fibonacci(n):
    a, b = 0, 1
    seq = []
    for _ in range(n):
        seq.append(a)
        a, b = b, a + b
    return seq

fibs = fibonacci(15)
print("Fibonacci Sequence (first 15 terms):")
print(fibs)

print("\\nGolden Ratio Approximations (F_n / F_n-1):")
for i in range(2, len(fibs)):
    ratio = fibs[i] / fibs[i-1]
    print(f"Term {i:2d}: {fibs[i]:4d} / {fibs[i-1]:4d} = {ratio:.6f}")
`,
  },
  {
    id: "data-stats",
    name: "📊 Data Stats & Frequency",
    category: "Data",
    description: "Compute statistical metrics and ASCII histogram",
    code: `# Statistical summary and ASCII histogram
import math
from collections import Counter

data = [42, 65, 78, 88, 92, 92, 85, 76, 95, 88, 84, 91, 100, 73, 89]

n = len(data)
mean = sum(data) / n
variance = sum((x - mean) ** 2 for x in data) / n
std_dev = math.sqrt(variance)

print(f"Dataset size : {n}")
print(f"Min value    : {min(data)}")
print(f"Max value    : {max(data)}")
print(f"Mean (Avg)   : {mean:.2f}")
print(f"Std Dev      : {std_dev:.2f}")

# Histogram
print("\\nScore Distribution:")
buckets = {"70-79": 0, "80-89": 0, "90-100": 0}
for val in data:
    if val < 80: buckets["70-79"] += 1
    elif val < 90: buckets["80-89"] += 1
    else: buckets["90-100"] += 1

for k, count in buckets.items():
    bar = "█" * (count * 3)
    print(f"{k} | {bar} ({count})")
`,
  },
  {
    id: "canvas-shapes",
    name: "🎨 Whiteboard Shape Architect",
    category: "MasmSpace Canvas",
    description: "Generate structured diagram node coordinates for the canvas",
    code: `# Generate MasmSpace diagram architecture specs
import json

nodes = [
    {"label": "Client (Next.js)", "role": "Frontend UI", "color": "violet"},
    {"label": "Pyodide WASM", "role": "Local Python", "color": "blue"},
    {"label": "Web Speech API", "role": "Voice Control", "color": "green"},
    {"label": "FastAPI Layer", "role": "AI Summaries & RAG", "color": "orange"},
]

print("=== Architecture Flow Specs ===")
for i, node in enumerate(nodes, 1):
    print(f"Node {i}: [{node['color'].upper()}] {node['label']} -> {node['role']}")

output = {
    "system": "MasmSpace Collaborative Canvas",
    "total_nodes": len(nodes),
    "modules": nodes
}
# Last expression is captured as return value
json.dumps(output, indent=2)
`,
  },
];
