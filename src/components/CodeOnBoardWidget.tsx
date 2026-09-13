"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SUPPORTED_LANGUAGES,
  MULTI_LANG_TEMPLATES,
  executeUniversalCode,
} from "@/lib/universalCodeRunner";
import {
  type SupportedLanguage,
  type ExecutionResult,
  type CodeTemplate,
} from "@/types/codeRunner";
import { addNoteToCanvas } from "@/lib/canvasUtils";
import { type Editor } from "@tldraw/tldraw";

interface CodeOnBoardWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  editor?: Editor | null;
  onInsertToCanvas?: (content: string, isError?: boolean, language?: string, type?: "code" | "output") => void;
  leftOffset?: number;
}

export default function CodeOnBoardWidget({
  isOpen,
  onClose,
  editor,
  onInsertToCanvas,
  leftOffset = 280,
}: CodeOnBoardWidgetProps) {
  // Active programming language
  const [language, setLanguage] = useState<SupportedLanguage>("c");

  // Code editor text
  const [code, setCode] = useState<string>(
    SUPPORTED_LANGUAGES.find((l) => l.id === "c")?.defaultCode || ""
  );

  // Selected template preset
  const [selectedTemplate, setSelectedTemplate] = useState<string>("c-for-loop");

  // Auto-Iteration Mode (Iterates automatically as code is typed / modified)
  const [autoIterate, setAutoIterate] = useState<boolean>(true);

  // Execution state & outputs
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Ready");
  const [result, setResult] = useState<ExecutionResult | null>(null);

  // UI States
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"output" | "trace" | "preview">("output");

  // Dragging state (Starts to the right of the sidebar: left 280px, top 70px)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: leftOffset, y: 70 });
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (leftOffset !== undefined) {
      setPosition((prev) => ({ ...prev, x: leftOffset }));
    }
  }, [leftOffset]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoRunTimerRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Pyodide Web Worker lifecycle: Initialize ONLY when Code Studio panel is opened, terminate on close
  useEffect(() => {
    if (!isOpen) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      return;
    }

    // Initialize dedicated Pyodide WebAssembly worker off the main thread
    try {
      const worker = new Worker("/pyodide.worker.js");
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const data = e.data || {};
        if (data.type === "STATUS") {
          setStatusMessage(data.message || "Worker processing…");
        }
      };

      worker.onerror = (err) => {
        console.error("Pyodide worker error:", err);
      };

      // Send initial warm-up signal in background
      worker.postMessage({ type: "INIT" });
    } catch (err) {
      console.warn("Could not instantiate pyodide.worker.js, falling back to universal runner:", err);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [isOpen]);

  // Current language metadata
  const currentLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.id === language) || SUPPORTED_LANGUAGES[0];

  // Templates for current language
  const currentTemplates: CodeTemplate[] = MULTI_LANG_TEMPLATES[language] || [];

  // Handle language switch
  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const langMeta = SUPPORTED_LANGUAGES.find((l) => l.id === newLang);
    const templates = MULTI_LANG_TEMPLATES[newLang] || [];

    if (templates.length > 0) {
      setSelectedTemplate(templates[0].id);
      setCode(templates[0].code);
    } else if (langMeta) {
      setSelectedTemplate("");
      setCode(langMeta.defaultCode);
    }

    setResult(null);
    setStatusMessage("Ready");
    if (newLang === "html") {
      setActiveTab("preview");
    } else {
      setActiveTab("output");
    }
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const tpl = currentTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setCode(tpl.code);
      setSelectedTemplate(tpl.id);
      setResult(null);
      setStatusMessage("Ready");
    }
  };

  // Run code handler (routes Python to dedicated background worker with postMessage/onmessage)
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatusMessage(`Running ${currentLangInfo.name}…`);

    // 1. Offload Python execution to dedicated Web Worker (Zero UI Freeze on 4GB RAM)
    if (language === "python" && workerRef.current) {
      const worker = workerRef.current;

      return new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          worker.removeEventListener("message", workerListener);
          setResult({
            stdout: "",
            stderr: "Execution timed out after 30 seconds",
            returnValue: null,
            executionTimeMs: 30000,
            error: "Timeout",
            timestamp: new Date().toISOString(),
            language: "python",
          });
          setStatusMessage("Timed out");
          setIsRunning(false);
          resolve();
        }, 30000);

        const workerListener = (e: MessageEvent) => {
          const data = e.data || {};
          if (data.type === "STATUS") {
            setStatusMessage(data.message || "Executing in Pyodide Worker…");
            return;
          }

          clearTimeout(timeoutId);
          worker.removeEventListener("message", workerListener);

          if (data.type === "SUCCESS") {
            setResult({
              stdout: data.stdout || "",
              stderr: data.stderr || "",
              returnValue: data.returnValue || null,
              executionTimeMs: data.executionTimeMs || 0,
              error: null,
              timestamp: new Date().toISOString(),
              language: "python",
            });
            setStatusMessage("Completed");
          } else {
            setResult({
              stdout: data.stdout || "",
              stderr: data.stderr || data.error || "Execution error",
              returnValue: null,
              executionTimeMs: data.executionTimeMs || 0,
              error: data.error || "Execution Failed",
              timestamp: new Date().toISOString(),
              language: "python",
            });
            setStatusMessage("Error");
          }
          setIsRunning(false);
          resolve();
        };

        worker.addEventListener("message", workerListener);
        // Post message with code string to Pyodide worker
        worker.postMessage({ type: "RUN_PYTHON", code });
      });
    }

    // 2. Other languages or fallback
    try {
      const res = await executeUniversalCode(code, language, (msg) => {
        setStatusMessage(msg);
      });
      setResult(res);
      setStatusMessage(res.error ? "Error" : "Completed");
    } catch (err: any) {
      setResult({
        stdout: "",
        stderr: err.message || String(err),
        returnValue: null,
        executionTimeMs: 0,
        error: err.message || "Execution Failed",
        timestamp: new Date().toISOString(),
        language,
      });
      setStatusMessage("Error");
    } finally {
      setIsRunning(false);
    }
  }, [code, language, currentLangInfo.name, isRunning]);

  // Auto-Iteration effect (debounced 350ms when code changes and autoIterate is active)
  useEffect(() => {
    if (!isOpen || !autoIterate) return;

    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current);
    }

    autoRunTimerRef.current = setTimeout(() => {
      handleRun();
    }, 350);

    return () => {
      if (autoRunTimerRef.current) {
        clearTimeout(autoRunTimerRef.current);
      }
    };
  }, [code, language, autoIterate, isOpen, handleRun]);

  // Run on initial open
  useEffect(() => {
    if (isOpen && !result && !isRunning) {
      handleRun();
    }
  }, [isOpen, result, isRunning, handleRun]);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to execute
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
      return;
    }

    // Support Tab indentation inside the textarea
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      setCode(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
            start + 4;
        }
      }, 0);
    }
  };

  // Clear output
  const handleClearOutput = () => {
    setResult(null);
    setStatusMessage("Ready");
  };

  // Context-aware text inserter to whiteboard canvas (Code or Output)
  const handleAddTextToCanvas = (content: string, type: "code" | "output" = "output") => {
    if (!content || !content.trim()) return;

    if (onInsertToCanvas) {
      onInsertToCanvas(content, !!result?.error, language, type);
      return;
    }

    if (!editor) return;

    const viewport = editor.getViewportPageBounds();
    const centerX = viewport ? viewport.center.x : 300;
    const centerY = viewport ? viewport.center.y : 200;

    const langTitle = language
      ? language.charAt(0).toUpperCase() + language.slice(1)
      : "Code";

    const header = type === "code" ? `// ${langTitle} Source Code:\n\n` : `${langTitle} Output:\n\n`;
    const noteText = `${header}${content.slice(0, 1000)}`;

    addNoteToCanvas(
      editor,
      noteText,
      centerX - 100,
      centerY - 100,
      type === "code" ? "blue" : result?.error ? "red" : "violet"
    );
  };

  // Add source code directly to canvas
  const handleAddCodeToCanvas = () => {
    handleAddTextToCanvas(code, "code");
  };

  // Add execution output directly to canvas
  const handleAddOutputToCanvas = () => {
    const rawContent =
      result?.stdout?.trim() ||
      result?.returnValue ||
      (result?.error ? `Error:\n${result.error}` : "No output available");
    handleAddTextToCanvas(rawContent, "output");
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Drag listeners on header (Throttled to >= 100ms to save CPU & memory on low-end hardware)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("select") ||
      (e.target as HTMLElement).closest("input")
    ) {
      return;
    }

    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    let lastUpdateTime = 0;
    let pendingPosition: { x: number; y: number } | null = null;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(
        10,
        Math.min(window.innerWidth - 320, moveEvent.clientX - dragStartOffsetRef.current.x)
      );
      const newY = Math.max(
        10,
        Math.min(window.innerHeight - 120, moveEvent.clientY - dragStartOffsetRef.current.y)
      );

      pendingPosition = { x: newX, y: newY };
      const now = performance.now();

      // Enforce at least 100ms throttle interval to prevent per-frame React state re-renders
      if (now - lastUpdateTime >= 100) {
        lastUpdateTime = now;
        setPosition(pendingPosition);
      } else if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          if (isDraggingRef.current && pendingPosition) {
            setPosition(pendingPosition);
            lastUpdateTime = performance.now();
          }
          throttleTimer = null;
        }, 100);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }
      // Commit final position immediately on drop
      if (pendingPosition) {
        setPosition(pendingPosition);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50 code-on-board-widget glass bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
        style={{
          left: position.x,
          top: position.y,
          width: isMinimized ? "340px" : "620px",
          maxHeight: "92vh",
          zIndex: 50,
        }}
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-label="Universal Multi-Language Code Studio"
      >
        {/* ── Widget Header (Draggable) ─────────────────────────────────── */}
        <div
          className="widget-header cursor-grab active:cursor-grabbing flex items-center justify-between p-3 border-b border-white/10 select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{currentLangInfo.icon}</span>
            <span className="font-bold text-sm text-zinc-100 font-sans tracking-tight">
              Code Studio
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-neon-cyan border border-cyan-400/30">
              {currentLangInfo.badge}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Iterate Toggle Switch */}
            <button
              type="button"
              onClick={() => setAutoIterate(!autoIterate)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                autoIterate
                  ? "bg-neon-green/20 text-neon-green border border-neon-green/50 shadow-[0_0_8px_rgba(0,255,136,0.3)]"
                  : "bg-white/5 text-zinc-400 border border-white/10 hover:text-zinc-200"
              }`}
              title={
                autoIterate
                  ? "Auto-Iteration ON: Automatically iterates & runs as you type"
                  : "Auto-Iteration OFF: Click Run Code manually"
              }
            >
              <span className="text-[11px]">{autoIterate ? "⚡" : "⏸"}</span>
              <span>{autoIterate ? "Auto-Iterate ON" : "Manual Run"}</span>
            </button>

            <button
              className="widget-btn p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-colors"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
              aria-label={isMinimized ? "Expand widget" : "Minimize widget"}
            >
              {isMinimized ? "◻" : "–"}
            </button>
            <button
              className="widget-btn close-btn p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
              onClick={onClose}
              title="Close widget"
              aria-label="Close widget"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Collapsed view ────────────────────────────────────────────── */}
        {isMinimized ? (
          <div
            className="minimized-strip p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs font-mono text-zinc-400">
                {currentLangInfo.name} • {statusMessage}
              </span>
            </div>
            <button
              className="btn-run-sm px-2.5 py-1 rounded-lg bg-neon-cyan text-black font-bold text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleRun();
              }}
            >
              ▶ Run
            </button>
          </div>
        ) : (
          /* ── Expanded Content ─────────────────────────────────────────── */
          <div className="widget-body flex flex-col">
            {/* ── Language Selector Bar ──────────────────────────────────── */}
            <div className="px-3 pt-2 pb-1.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex-shrink-0">
                Lang:
              </span>
              <div className="flex items-center gap-1">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isActive = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => handleSelectLanguage(lang.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-[0_0_10px_rgba(0,245,255,0.2)] font-bold"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                      }`}
                      title={`${lang.name} (${lang.badge}) - ${lang.description}`}
                    >
                      <span className="text-xs">{lang.icon}</span>
                      <span>{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Preset Template Picker & Subbar ────────────────────────── */}
            <div className="code-subbar flex items-center justify-between p-2.5 border-b border-white/10 bg-white/[0.02]">
              <div className="template-picker flex items-center gap-2 flex-1 mr-2">
                <span className="text-zinc-400 text-xs font-mono">Preset:</span>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="template-select bg-[#121622] text-zinc-200 text-xs rounded-lg px-2 py-1 border border-white/15 outline-none focus:border-neon-cyan flex-1 max-w-[260px]"
                  aria-label="Select code iteration template"
                >
                  {currentTemplates.length > 0 ? (
                    currentTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Default {currentLangInfo.name} Starter</option>
                  )}
                </select>
              </div>

              <div className="subbar-actions flex items-center gap-1.5">
                <button
                  className="subbar-btn px-2.5 py-1 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                  onClick={handleCopy}
                  title="Copy code to clipboard"
                >
                  {isCopied ? "✓ Copied" : "📋 Copy"}
                </button>
                <button
                  className="subbar-btn insert-btn px-2.5 py-1 rounded-lg text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)] flex items-center gap-1 font-medium"
                  onClick={handleAddCodeToCanvas}
                  title="Paste source code onto canvas"
                >
                  <span>📄</span>
                  <span>Add Code</span>
                </button>
              </div>
            </div>

            {/* ── Code Editor ────────────────────────────────────────────── */}
            <div className="code-editor-container flex relative bg-[#090b10] border-b border-white/10 min-h-[160px] max-h-[260px] overflow-hidden">
              <div
                className="editor-line-numbers py-2 px-2.5 text-right text-zinc-600 font-mono text-xs select-none border-r border-white/5 bg-[#07080d]"
                aria-hidden="true"
              >
                {code.split("\n").map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="code-textarea flex-1 p-2 bg-transparent text-zinc-100 font-mono text-xs leading-5 outline-none resize-none overflow-y-auto no-scrollbar"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`// Write ${currentLangInfo.name} code or iterations here...`}
                spellCheck={false}
                aria-label={`${currentLangInfo.name} code input`}
              />
            </div>

            {/* ── Action Bar ─────────────────────────────────────────────── */}
            <div className="code-action-bar flex items-center justify-between p-2 border-b border-white/10 bg-[#0d1017]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning
                      ? "bg-amber-400 animate-spin"
                      : result?.error
                      ? "bg-red-400"
                      : "bg-neon-green"
                  }`}
                />
                <span className="text-xs font-mono text-zinc-400">
                  {statusMessage}
                </span>

                {autoIterate && (
                  <span className="text-[10px] font-mono text-neon-green px-1.5 py-0.2 rounded bg-neon-green/10 border border-neon-green/20">
                    ⚡ live
                  </span>
                )}
              </div>

              <div className="action-buttons flex items-center gap-2">
                {result && (
                  <button
                    className="btn-clear text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={handleClearOutput}
                    title="Clear console output"
                  >
                    Clear
                  </button>
                )}
                <button
                  className="btn-run px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_14px_rgba(0,245,255,0.25)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  onClick={handleRun}
                  disabled={isRunning}
                  title="Run Code & Compute Iterations (Ctrl+Enter)"
                >
                  {isRunning ? (
                    <>
                      <span className="spinner-sm w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Iterating…</span>
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      <span>Run {currentLangInfo.name}</span>
                      <kbd className="kbd-shortcut text-[10px] px-1 py-0.5 rounded bg-black/20 text-black/80 font-mono">
                        Ctrl+↵
                      </kbd>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Output & Iterations Inspector Panel ─────────────────────── */}
            <div className="output-panel bg-[#07080d] flex flex-col min-h-[140px] max-h-[220px] overflow-hidden">
              <div className="output-header flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#0a0d14]">
                <div className="output-tabs flex items-center gap-2">
                  <button
                    className={`output-tab text-xs font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activeTab === "output"
                        ? "text-neon-cyan bg-neon-cyan/15 font-bold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    onClick={() => setActiveTab("output")}
                  >
                    Terminal Output
                  </button>

                  {result?.steps && result.steps.length > 0 && (
                    <button
                      className={`output-tab text-xs font-mono px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                        activeTab === "trace"
                          ? "text-neon-green bg-neon-green/15 font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      onClick={() => setActiveTab("trace")}
                    >
                      <span>🔄 Loop Trace</span>
                      <span className="text-[10px] px-1 rounded-full bg-neon-green/20 text-neon-green">
                        {result.steps.length}
                      </span>
                    </button>
                  )}

                  {language === "html" && (
                    <button
                      className={`output-tab text-xs font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                        activeTab === "preview"
                          ? "text-purple-400 bg-purple-400/15 font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      onClick={() => setActiveTab("preview")}
                    >
                      🌐 Component Preview
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                  {result?.iterationCount !== undefined && (
                    <span className="text-neon-green">
                      🔄 {result.iterationCount}
                    </span>
                  )}
                  {result && (
                    <span className="execution-time text-zinc-500">
                      ⚡ {result.executionTimeMs}ms
                    </span>
                  )}
                  <button
                    type="button"
                    className="px-2.5 py-0.5 rounded-lg text-xs bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-400/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.15)] flex items-center gap-1 font-medium disabled:opacity-40"
                    onClick={handleAddOutputToCanvas}
                    title="Paste terminal output onto canvas"
                    disabled={!result && !isRunning}
                  >
                    <span>📌</span>
                    <span>Add Output</span>
                  </button>
                </div>
              </div>

              {/* Output Content */}
              <div className="output-body p-3 overflow-y-auto font-mono text-xs flex-1 no-scrollbar">
                {isRunning ? (
                  <div className="output-loading flex items-center gap-2 text-zinc-400">
                    <span className="spinner-sm w-3 h-3 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                    <span>Executing {currentLangInfo.name} iterations…</span>
                  </div>
                ) : activeTab === "preview" && language === "html" ? (
                  <div className="w-full h-full p-2 bg-[#0d1017] rounded-xl border border-white/10">
                    <iframe
                      srcDoc={code}
                      title="HTML Preview"
                      sandbox="allow-scripts"
                      className="w-full h-36 border-none rounded"
                    />
                  </div>
                ) : activeTab === "trace" && result?.steps ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pb-1">
                      Step-by-Step Loop Iteration Log:
                    </div>
                    {result.steps.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 py-0.5 px-2 rounded bg-white/[0.03] border border-white/5 hover:border-neon-green/30 transition-colors"
                      >
                        <span className="text-neon-green font-bold text-[10px] w-14">
                          Step #{s.step}:
                        </span>
                        <span className="text-zinc-200 text-xs font-mono flex-1">
                          {s.output}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : result ? (
                  result.error ? (
                    <div className="output-error">
                      <div className="error-badge text-red-400 font-bold mb-1">
                        Traceback / Compilation Error:
                      </div>
                      <pre className="error-text text-red-300 whitespace-pre-wrap">
                        {result.error}
                      </pre>
                    </div>
                  ) : result.stdout ? (
                    <pre className="output-text text-zinc-200 whitespace-pre-wrap">
                      {result.stdout}
                    </pre>
                  ) : (
                    <div className="output-empty text-zinc-500 italic">
                      Program executed successfully with no stdout output.
                    </div>
                  )
                ) : (
                  <div className="output-placeholder text-zinc-500 flex flex-col gap-1">
                    <span>
                      Select any language (C, C++, Java, JS, TS, C#, Python) or change numbers to watch loops iterate automatically!
                    </span>
                    <span className="security-notice text-[10px] text-zinc-600">
                      🔒 Realtime Sandbox: In-browser instant loop iterations with zero network lag.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Named alias export for CodeStudio
export { CodeOnBoardWidget as CodeStudio };
