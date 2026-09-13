// ─────────────────────────────────────────────────────────────────────────────
// MasmSpace — Code-on-Board (Pyodide WebAssembly Runner) Types
// ─────────────────────────────────────────────────────────────────────────────

export type PyodideStatus =
  | "unloaded"
  | "loading_script"
  | "loading_wasm"
  | "ready"
  | "running"
  | "error";

export interface PyodideExecutionResult {
  stdout: string;
  stderr: string;
  returnValue: string | null;
  executionTimeMs: number;
  error: string | null;
  timestamp: string;
}

export type SupportedLanguage =
  | "c"
  | "cpp"
  | "java"
  | "javascript"
  | "typescript"
  | "csharp"
  | "python"
  | "sql"
  | "html"
  | "rust"
  | "go"
  | "php";

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  badge: string;
  icon: string;
  fileExt: string;
  defaultCode: string;
  description: string;
}

export interface IterationStep {
  step: number;
  variable: string;
  value: string | number;
  output: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  returnValue: string | null;
  executionTimeMs: number;
  error: string | null;
  timestamp: string;
  iterationCount?: number;
  steps?: IterationStep[];
  language: SupportedLanguage;
}

export interface CodeTemplate {
  id: string;
  name: string;
  category: "Algorithm" | "Math" | "Data" | "MasmSpace Canvas";
  description: string;
  code: string;
}

export interface CodeWidgetState {
  code: string;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  width: number;
  height: number;
  language?: SupportedLanguage;
  autoIterate?: boolean;
}
