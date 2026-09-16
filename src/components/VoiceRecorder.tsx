"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

export interface VoiceRecorderProps {
  /** Callback invoked whenever live transcribed text updates */
  onTranscriptSync?: (transcript: string) => void;
  /** Optional current value of the chat/command input to append or sync to */
  currentInput?: string;
  /** Custom CSS classes for the mic trigger button */
  className?: string;
  /** Placeholder or title tooltip */
  title?: string;
}

export function VoiceRecorder({
  onTranscriptSync,
  currentInput = "",
  className = "",
  title = "Click to speak voice prompt",
}: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  isListeningRef.current = isListening;

  // ── Show Toast Notification ────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // ── 1. Check Browser Compatibility & Initialize Web Speech API ─────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check browser compatibility (Standard SpeechRecognition or WebKit fallback)
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    // ── 2. Handle Live Speech Transcription ──────────────────────────────────
    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const chunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalTranscript += chunk;
        } else {
          interimTranscript += chunk;
        }
      }

      const activeText = (finalTranscript || interimTranscript).trim();

      // Properly update React state
      setTranscript(activeText);

      // Sync transcribed text with Chat / Command input box
      if (activeText && onTranscriptSync) {
        onTranscriptSync(activeText);
      }
    };

    // ── 3. Handle Permission & Speech Recognition Errors ─────────────────────
    recognition.onerror = (event: any) => {
      const err = String(event?.error || "").toLowerCase();

      // Gracefully ignore user aborts or silence pauses
      if (err === "aborted" || err === "no-speech") return;

      if (err === "not-allowed" || err === "service-not-allowed") {
        setIsListening(false);
        isListeningRef.current = false;
        showToast("Microphone access denied. Please allow it in browser settings.");
        return;
      }

      showToast(`Speech input error: ${event.error || "Unknown error"}`);
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [onTranscriptSync, showToast]);

  // ── 4. Toggle Voice Recording with Strict Microphone Permission Check ──────
  const toggleRecording = async () => {
    if (!isSupported) {
      showToast(
        "Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    // Wrap microphone request in try...catch block to catch user denials
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release tracks immediately so SpeechRecognition can bind cleanly
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (micErr: any) {
      console.warn("[VoiceRecorder] Microphone permission denied:", micErr);
      setIsListening(false);
      isListeningRef.current = false;
      showToast("Microphone access denied. Please allow it in browser settings.");
      return;
    }

    try {
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (startErr: any) {
      console.warn("[VoiceRecorder] Recognition start error:", startErr);
      if (
        startErr?.name === "NotAllowedError" ||
        String(startErr).toLowerCase().includes("denied")
      ) {
        showToast("Microphone access denied. Please allow it in browser settings.");
      }
    }
  };

  return (
    <>
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-5 right-5 z-[999999] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-mono shadow-2xl backdrop-blur-xl"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-rose-400 hover:text-white p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Voice Mic Toggle Button ── */}
      <button
        type="button"
        onClick={toggleRecording}
        title={
          !isSupported
            ? "Speech recognition is not supported in this browser"
            : isListening
            ? "Stop recording"
            : title
        }
        className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all ${
          isListening
            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse"
            : "bg-white/5 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30"
        } ${className}`}
        aria-label={isListening ? "Stop Voice Recording" : "Start Voice Recording"}
      >
        {isListening ? (
          <>
            <span className="absolute inset-0 rounded-xl bg-rose-500/20 animate-ping opacity-75" />
            <MicOff className="w-4 h-4 relative z-10" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </>
  );
}

export default VoiceRecorder;
