"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp,
  FileText,
  Presentation,
  FileSpreadsheet,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface UniversalDocumentDropzoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessDocument: (file: File) => Promise<void>;
}

export function UniversalDocumentDropzoneModal({
  isOpen,
  onClose,
  onProcessDocument,
}: UniversalDocumentDropzoneModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("✨ Synthesizing Document for Canvas...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSubmission = useCallback(
    async (file: File) => {
      const validExtensions = [".pdf", ".docx", ".doc", ".pptx", ".ppt"];
      const hasValidExt = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidExt) {
        setErrorMessage("Please select a supported document (.pdf, .docx, or .pptx).");
        return;
      }

      const MAX_SIZE = 25 * 1024 * 1024; // 25MB
      if (file.size > MAX_SIZE) {
        setErrorMessage("File exceeds 25MB limit. Please upload a smaller document.");
        return;
      }

      try {
        setErrorMessage(null);
        setCurrentFileName(file.name);
        setIsSynthesizing(true);
        setStatusMessage("✨ Synthesizing Document for Canvas...");

        await onProcessDocument(file);

        // Success brief delay before closing
        setStatusMessage("✅ Rendered to Whiteboard Canvas!");
        setTimeout(() => {
          setIsSynthesizing(false);
          setCurrentFileName("");
          onClose();
        }, 800);
      } catch (err: any) {
        setIsSynthesizing(false);
        setErrorMessage(err.message || "Failed to process document.");
      }
    },
    [onProcessDocument, onClose]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSubmission(file);
      }
    },
    [handleFileSubmission]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSubmission(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSynthesizing && onClose()}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-3xl bg-[#09090b]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_40px_rgba(6,182,212,0.12)] text-white overflow-hidden select-none"
        >
          {/* Subtle Top Interior Neon Glow Line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Close Button */}
          {!isSynthesizing && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Header */}
          <div className="text-left mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono mb-2.5">
              <Sparkles className="w-3 h-3" />
              <span>Universal Document Engine</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Import Document to Canvas
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Upload PDF documents, Word reports, or PowerPoint presentations. Draw, annotate, and brainstorm seamlessly.
            </p>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* State Switch: Synthesizing Loader vs Interactive Dropzone */}
          {isSynthesizing ? (
            /* ── Framer Motion Premium Synthesizing Card ────────────────────── */
            <div className="my-4 py-8 px-6 rounded-2xl bg-white/[0.02] border border-cyan-500/30 text-center relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.15)]">
              {/* Rotating background aura */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Pulsing Center Graphic */}
              <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full border border-dashed border-cyan-400/40 absolute"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  <FileUp className="w-6 h-6" />
                </motion.div>
              </div>

              <h4 className="text-base font-semibold text-white tracking-tight">
                {statusMessage}
              </h4>
              <p className="mt-1 text-xs text-zinc-400 font-mono truncate max-w-xs mx-auto">
                {currentFileName}
              </p>

              {/* Glowing Animated Progress Bar */}
              <div className="mt-6 w-full max-w-xs h-1.5 bg-white/[0.08] rounded-full mx-auto overflow-hidden relative">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full"
                  animate={{
                    left: ["-100%", "100%"],
                    width: ["40%", "70%"],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <p className="mt-3 text-[11px] text-zinc-500">
                Converting slide layouts, vector paths & text layers for canvas...
              </p>
            </div>
          ) : (
            /* ── Interactive Drag & Drop Area ───────────────────────────────── */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 group ${
                isDragging
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.25)] scale-[1.01]"
                  : "border-white/15 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.04]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt"
                className="hidden"
                onChange={handleInputChange}
              />

              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4 text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400/40 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <FileUp className="w-6 h-6" />
              </div>

              <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Drop your document here, or <span className="text-cyan-400 underline underline-offset-4">browse files</span>
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Supports multi-page documents up to 25MB
              </p>

              {/* Supported Format Pills */}
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-red-500/10 border border-red-500/20 text-red-300">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  PDF (.pdf)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Word (.docx)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <Presentation className="w-3.5 h-3.5 text-amber-400" />
                  PowerPoint (.pptx)
                </span>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 flex items-center justify-between text-[11px] text-zinc-500 border-t border-white/[0.08] pt-4">
            <span>Locked background for freehand & shape sketching</span>
            <span className="font-mono">High-Res 2.0x Retina</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UniversalDocumentDropzoneModal;
