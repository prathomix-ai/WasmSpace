"use client";

import React, { useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Layers,
  Calendar,
  X,
  ArrowRight,
  Database,
  Tag,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { type SessionResult, type SearchMode } from "@/types/rag";
import { useRagSearch } from "@/hooks/useRagSearch";

// ─────────────────────────────────────────────────────────────────────────────
// Suggested queries for quick discovery
// ─────────────────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Login architecture flow",
  "Microservices blueprint",
  "Payment gateway topology",
  "Redis cache layer",
  "Database cluster failover",
];

// ─────────────────────────────────────────────────────────────────────────────
// Result Card - Modern Whiteboard UI
// ─────────────────────────────────────────────────────────────────────────────
function ResultCard({
  result,
  index,
  onNavigate,
}: {
  result: SessionResult;
  index: number;
  onNavigate: (boardId: string, sessionId: string) => void;
}) {
  const scorePercent = Math.round(
    result.mode === "vector"
      ? result.score * 100
      : Math.min(result.score * 100 * 8, 100)
  );

  const formattedDate = result.session_date
    ? new Date(result.session_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      className="group p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all duration-150 cursor-pointer flex flex-col gap-2 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={() => onNavigate(result.board_id, result.session_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onNavigate(result.board_id, result.session_id)}
      aria-label={`Open board: ${result.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-zinc-100 group-hover:text-white truncate">
            {result.title}
          </span>
        </div>

        {/* Relevance match pill */}
        <div className="flex items-center gap-1.5 shrink-0 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/60">
          <span className="text-[10px] font-mono font-medium text-blue-400">
            {scorePercent}% match
          </span>
        </div>
      </div>

      {result.extracted_text && (
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {result.extracted_text}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1 border-t border-zinc-800/60 text-[11px] text-zinc-500">
        {formattedDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {formattedDate}
          </span>
        )}
        {result.shape_count != null && result.shape_count > 0 && (
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> {result.shape_count} shapes
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto overflow-hidden">
          {result.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel - Spotlight Command Palette Style
// ─────────────────────────────────────────────────────────────────────────────
export interface BoardBrainSearchProps {
  isOpen: boolean;
  ownerId?: string;
  onClose: () => void;
  onNavigateToBoard?: (boardId: string, sessionId: string) => void;
}

export default function BoardBrainSearch({
  isOpen,
  ownerId = "anonymous",
  onClose,
  onNavigateToBoard = () => {},
}: BoardBrainSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    setQuery,
    results,
    isSearching,
    error,
    mode,
    setMode,
    search,
    clearResults,
    modelUsed,
    resultCount,
  } = useRagSearch({ ownerId });

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      clearResults();
    }
  }, [isOpen, clearResults]);

  // Escape to close
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") search();
    },
    [search]
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      search(suggestion);
    },
    [setQuery, search]
  );

  const hasResults = results.length > 0;
  const hasSearched = !isSearching && (hasResults || error || (query && resultCount === 0));

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          role="dialog"
          aria-modal="true"
          aria-label="Board Brain Search"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            className="relative w-full max-w-xl rounded-2xl bg-[#121316] border border-zinc-800 shadow-2xl overflow-hidden z-10 text-zinc-100 flex flex-col max-h-[82vh]"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* Header: Title + Mode Toggle + Close */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white tracking-tight font-sans">
                    Board Brain Search
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Semantic neural search across all boards &amp; architecture notes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Segmented Mode Toggle */}
                <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60 text-[11px] font-medium">
                  {(["vector", "hybrid"] as SearchMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        mode === m
                          ? "bg-zinc-700 text-white shadow-sm font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title={
                        m === "vector"
                          ? "Semantic vector similarity"
                          : "Hybrid vector + BM25 keyword fusion"
                      }
                    >
                      {m === "vector" ? "Vector" : "Hybrid"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center gap-2.5 bg-zinc-900/40">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask or search your boards (e.g., 'authentication topology', 'redis cache')..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/70 text-zinc-100 text-xs placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <button
                type="button"
                onClick={() => search()}
                disabled={isSearching || !query.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Search</span>
                    <kbd className="text-[10px] bg-blue-700/80 px-1 py-0.2 rounded text-blue-100 font-mono">↵</kbd>
                  </>
                )}
              </button>
            </div>

            {/* Scrollable Results & Empty States */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[160px] max-h-[420px]">
              {/* Suggestions chips */}
              {!hasResults && !isSearching && !hasSearched && (
                <div className="space-y-3 py-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block">
                    Suggested Queries
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 hover:text-white text-zinc-300 text-xs border border-zinc-700/60 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {error && !isSearching && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Empty Results */}
              {!isSearching && !error && query && resultCount === 0 && hasSearched && (
                <div className="py-8 text-center flex flex-col items-center gap-2 text-zinc-400">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-1">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-200">No matching boards found</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                    Try different keywords or index boards using &ldquo;Save &amp; Index&rdquo; in the sidebar.
                  </p>
                </div>
              )}

              {/* Result Cards List */}
              {hasResults &&
                results.map((result, i) => (
                  <ResultCard
                    key={result.session_id}
                    result={result}
                    index={i}
                    onNavigate={onNavigateToBoard}
                  />
                ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-400">
              <span>
                {resultCount > 0 ? `${resultCount} result${resultCount > 1 ? "s" : ""} · ` : ""}
                Neural RAG index
              </span>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px]">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
