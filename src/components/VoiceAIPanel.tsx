"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Sparkles,
  Zap,
  Crown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Volume2,
  Maximize2,
  Minimize2,
  HelpCircle,
  Flame,
  Layers,
  Palette,
  Trash2,
  Copy,
  Info,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CanvasVoiceAction, VoiceCommandResponse } from "@/types/voiceControl";

// Declare global Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ── Strict Color Hex Sanitizer ────────────────────────────────────────────────
const VALID_HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function sanitizeColor(color: any, fallback: string = "#00f5ff"): string {
  if (typeof color === "string") {
    const clean = color.trim();
    if (VALID_HEX_REGEX.test(clean)) return clean;
    if (/^rgba?\([\d\s,.]+\)$/i.test(clean)) return clean;
  }
  return fallback;
}

function sanitizeNumber(val: any, fallback: number, min: number = 10, max: number = 3000): number {
  const num = Number(val);
  if (!isFinite(num) || isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

// ── 0. React Error Boundary to Prevent Canvas Crashes ────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class VoiceAIErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || "Unexpected Voice AI error" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[VoiceAIErrorBoundary] Caught crash:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 z-[100] w-80 p-4 rounded-2xl bg-zinc-950/95 border border-rose-500/40 shadow-2xl backdrop-blur-2xl text-white font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Voice AI Studio Paused</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            A temporary component error occurred: {this.state.errorMessage}
          </p>
          <button
            onClick={this.handleReset}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Voice AI</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Toast Notification Interface ─────────────────────────────────────────────
interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export interface VoiceAIPanelProps {
  excalidrawAPI: any;
  onOpenUpgradeModal?: () => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function VoiceAIPanelInner({
  excalidrawAPI,
  onOpenUpgradeModal,
  className = "",
  isOpen = true,
  onClose,
}: VoiceAIPanelProps) {
  // ── 1. Speech Recognition & UI State ────────────────────────────────────────
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [continuousMode, setContinuousMode] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [recognizedActions, setRecognizedActions] = useState<CanvasVoiceAction[]>([]);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showCheatsheet, setShowCheatsheet] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // ── 2. Tier Validation State ────────────────────────────────────────────────
  const [isPro, setIsPro] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // References to eliminate race conditions & avoid closures
  const recognitionRef = useRef<any>(null);
  const isContinuousRef = useRef<boolean>(false);
  isContinuousRef.current = continuousMode;
  const isListeningRef = useRef<boolean>(false);
  isListeningRef.current = isListening;
  const recognitionStoppingRef = useRef<boolean>(false);
  const consecutiveErrorsRef = useRef<number>(0);

  // ── Toast Dispatcher ────────────────────────────────────────────────────────
  const pushToast = useCallback((message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── 3. Safe Supabase Tier & Role Validation (Timeout Guarded) ──────────────
  useEffect(() => {
    let isMounted = true;

    async function checkUserTier() {
      try {
        // 1. Immediate local cache check for 0-latency UI initial render
        if (typeof window !== "undefined") {
          try {
            const localUser =
              localStorage.getItem("masmspace_current_user") ||
              localStorage.getItem("wasmspace_current_user");
            if (localUser) {
              const parsed = JSON.parse(localUser);
              if (parsed?.email) {
                if (isMounted) setUserEmail(parsed.email);
                const isLocalPro =
                  parsed.role === "admin" ||
                  parsed.role === "pro" ||
                  parsed.subscription_status === "pro" ||
                  parsed.subscription_status === "active";
                if (isMounted) setIsPro(isLocalPro);
              }
            }
          } catch {}
        }

        // 2. Safe Supabase fetch with 3000ms timeout
        const supabase = createClient();
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 3000)
        );

        const { data: authData } = await Promise.race([authPromise, timeoutPromise]);
        const user = authData?.user;

        if (user && isMounted) {
          setUserEmail(user.email || "");
          setUserId(user.id);

          const profilePromise = supabase
            .from("profiles")
            .select("id, email, role, subscription_status")
            .eq("id", user.id)
            .maybeSingle();

          const profileTimeout = new Promise<{ data: null }>((resolve) =>
            setTimeout(() => resolve({ data: null }), 3000)
          );

          const { data: profile } = await Promise.race([profilePromise, profileTimeout]);

          if (profile && isMounted) {
            const sub = (profile.subscription_status || "").toLowerCase();
            const role = (profile.role || "").toLowerCase();
            const hasPro = sub === "pro" || sub === "active" || role === "admin";
            setIsPro(hasPro);
          }
        }
      } catch (err) {
        console.warn("[VoiceAI] Safe fallback to FREE tier on Supabase sync:", err);
        if (isMounted) setIsPro(false);
      }
    }

    checkUserTier();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── 4. Web Speech API Lifecycle & Strict Edge-Case Handling ────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      consecutiveErrorsRef.current = 0;
      recognitionStoppingRef.current = false;
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalSpeech = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptChunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalSpeech += transcriptChunk;
        } else {
          interim += transcriptChunk;
        }
      }

      setLiveTranscript(finalSpeech || interim);

      if (finalSpeech.trim()) {
        handleVoiceSubmission(finalSpeech.trim());
      }
    };

    recognition.onerror = (event: any) => {
      const err = String(event.error || "").toLowerCase();

      // Gracefully ignore intentional aborts
      if (err === "aborted") return;

      if (err === "no-speech") {
        // Natural speech pause. Do not disconnect continuous mode
        return;
      }

      // Fatal permission or hardware errors
      if (err === "not-allowed" || err === "service-not-allowed") {
        consecutiveErrorsRef.current = 99;
        isListeningRef.current = false;
        setIsListening(false);
        setContinuousMode(false);
        pushToast(
          "Microphone access blocked. Click the lock or camera icon in your address bar to allow permissions.",
          "error"
        );
        return;
      }

      if (err === "audio-capture") {
        consecutiveErrorsRef.current = 99;
        isListeningRef.current = false;
        setIsListening(false);
        setContinuousMode(false);
        pushToast("No microphone detected on your device. Please plug in an audio input.", "error");
        return;
      }

      if (err === "network") {
        consecutiveErrorsRef.current += 1;
        pushToast("Speech recognition network timeout. Reconnecting...", "warning");
        return;
      }

      consecutiveErrorsRef.current += 1;
      pushToast(`Speech input error: ${err}`, "warning");
    };

    recognition.onend = () => {
      // PRO Feature: Auto-reconnect continuous mode only if not manually stopped and no fatal errors
      if (
        isContinuousRef.current &&
        isListeningRef.current &&
        !recognitionStoppingRef.current &&
        consecutiveErrorsRef.current < 3
      ) {
        try {
          recognition.start();
        } catch {}
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionStoppingRef.current = true;
      try {
        recognition.abort();
      } catch {}
    };
  }, [pushToast]);

  // ── 5. Excalidraw Execution Engine with Strict Canvas Stability ─────────────
  const executeActionsOnCanvas = useCallback(
    async (actions: CanvasVoiceAction[]) => {
      if (!excalidrawAPI) {
        pushToast("Excalidraw canvas is not ready. Please try again in a moment.", "warning");
        return;
      }

      if (!Array.isArray(actions) || actions.length === 0) return;

      try {
        const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

        // Safe scene fetching
        let currentElements: any[] = [];
        try {
          currentElements = [...(excalidrawAPI.getSceneElements() || [])];
        } catch {
          currentElements = [];
        }

        const appState = excalidrawAPI.getAppState() || {};
        const selectedIdMap = appState.selectedElementIds || {};
        const selectedIds = Object.keys(selectedIdMap).filter((id) => selectedIdMap[id]);

        // Default viewport placement calculation
        const scrollX = typeof appState.scrollX === "number" ? appState.scrollX : 0;
        const scrollY = typeof appState.scrollY === "number" ? appState.scrollY : 0;
        const zoomVal = appState.zoom?.value || 1;
        const viewportCenter = {
          x: -scrollX + (typeof window !== "undefined" ? window.innerWidth : 1000) / (2 * zoomVal) - 100,
          y: -scrollY + (typeof window !== "undefined" ? window.innerHeight : 800) / (2 * zoomVal) - 60,
        };

        const createdIdMap = new Map<string, string>();
        const newlyCreatedIds: string[] = [];
        let updatedScene = [...currentElements];

        for (const actionItem of actions) {
          if (!actionItem || typeof actionItem !== "object") continue;

          switch (actionItem.action) {
            case "add_shape": {
              let shapeType = String(actionItem.type || actionItem.shape || "rectangle").toLowerCase();
              if (["circle", "oval"].includes(shapeType)) shapeType = "ellipse";
              if (["box", "square"].includes(shapeType)) shapeType = "rectangle";
              if (!["rectangle", "ellipse", "diamond", "arrow", "line"].includes(shapeType)) {
                shapeType = "rectangle";
              }

              const strokeColor = sanitizeColor(actionItem.color, "#00f5ff");
              const backgroundColor = sanitizeColor(
                actionItem.backgroundColor,
                shapeType === "rectangle" ? "rgba(0, 245, 255, 0.1)" : "transparent"
              );

              const width = sanitizeNumber(actionItem.width, 200, 30, 2500);
              const height = sanitizeNumber(actionItem.height, 130, 30, 2500);
              const posX =
                typeof actionItem.x === "number" && isFinite(actionItem.x)
                  ? actionItem.x
                  : viewportCenter.x + newlyCreatedIds.length * 40;
              const posY =
                typeof actionItem.y === "number" && isFinite(actionItem.y)
                  ? actionItem.y
                  : viewportCenter.y + newlyCreatedIds.length * 30;

              try {
                const newShape = convertToExcalidrawElements([
                  {
                    type: shapeType as any,
                    x: posX,
                    y: posY,
                    width,
                    height,
                    strokeColor,
                    backgroundColor,
                    fillStyle: "solid",
                    label: actionItem.label
                      ? {
                          text: String(actionItem.label).slice(0, 80),
                          fontSize: 16,
                          strokeColor: "#ffffff",
                        }
                      : undefined,
                  },
                ]);

                if (newShape && newShape.length > 0) {
                  const createdEl = newShape[0];
                  if (actionItem.id) createdIdMap.set(actionItem.id, createdEl.id);
                  newlyCreatedIds.push(createdEl.id);
                  updatedScene.push(createdEl);
                }
              } catch (shapeErr) {
                console.warn("[VoiceAI] convertToExcalidrawElements shape fallback:", shapeErr);
              }
              break;
            }

            case "add_text": {
              const textContent = String(actionItem.text || "Voice Note").slice(0, 250);
              const strokeColor = sanitizeColor(actionItem.color, "#ffffff");
              const fontSize = sanitizeNumber(actionItem.fontSize, 24, 12, 96);
              const posX =
                typeof actionItem.x === "number" && isFinite(actionItem.x)
                  ? actionItem.x
                  : viewportCenter.x + newlyCreatedIds.length * 40;
              const posY =
                typeof actionItem.y === "number" && isFinite(actionItem.y)
                  ? actionItem.y
                  : viewportCenter.y + newlyCreatedIds.length * 30;

              try {
                const newTextEl = convertToExcalidrawElements([
                  {
                    type: "text",
                    text: textContent,
                    x: posX,
                    y: posY,
                    fontSize,
                    strokeColor,
                  },
                ]);

                if (newTextEl && newTextEl.length > 0) {
                  const createdEl = newTextEl[0];
                  if (actionItem.id) createdIdMap.set(actionItem.id, createdEl.id);
                  newlyCreatedIds.push(createdEl.id);
                  updatedScene.push(createdEl);
                }
              } catch (textErr) {
                console.warn("[VoiceAI] convertToExcalidrawElements text fallback:", textErr);
              }
              break;
            }

            case "update_color": {
              const targetId = actionItem.targetId
                ? createdIdMap.get(actionItem.targetId) || actionItem.targetId
                : null;

              const newColor = sanitizeColor(actionItem.color, "#00f5ff");
              const newBgColor = actionItem.backgroundColor
                ? sanitizeColor(actionItem.backgroundColor, "transparent")
                : undefined;

              updatedScene = updatedScene.map((el) => {
                const isTarget =
                  (targetId && el.id === targetId) || (!targetId && selectedIds.includes(el.id));

                if (isTarget) {
                  return {
                    ...el,
                    strokeColor: newColor,
                    ...(newBgColor ? { backgroundColor: newBgColor } : {}),
                    version: (el.version || 1) + 1,
                    versionNonce: Math.floor(Math.random() * 100000),
                  };
                }
                return el;
              });
              break;
            }

            case "resize_element": {
              const targetId = actionItem.targetId
                ? createdIdMap.get(actionItem.targetId) || actionItem.targetId
                : null;

              const scale = sanitizeNumber(actionItem.scale, 1.5, 0.1, 10);

              updatedScene = updatedScene.map((el) => {
                const isTarget =
                  (targetId && el.id === targetId) || (!targetId && selectedIds.includes(el.id));

                if (isTarget) {
                  const newW = actionItem.width
                    ? sanitizeNumber(actionItem.width, el.width, 20, 3000)
                    : Math.round(el.width * scale);
                  const newH = actionItem.height
                    ? sanitizeNumber(actionItem.height, el.height, 20, 3000)
                    : Math.round(el.height * scale);

                  return {
                    ...el,
                    width: Math.max(newW, 20),
                    height: Math.max(newH, 20),
                    version: (el.version || 1) + 1,
                    versionNonce: Math.floor(Math.random() * 100000),
                  };
                }
                return el;
              });
              break;
            }

            case "duplicate": {
              const targetId = actionItem.targetId
                ? createdIdMap.get(actionItem.targetId) || actionItem.targetId
                : null;

              const elementsToDuplicate = updatedScene.filter((el) =>
                targetId ? el.id === targetId : selectedIds.includes(el.id)
              );

              const clonedElements = elementsToDuplicate.map((el) => {
                const cloneId = `voice_dup_${Math.random().toString(36).slice(2, 8)}`;
                return {
                  ...el,
                  id: cloneId,
                  x: el.x + 45,
                  y: el.y + 45,
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                };
              });

              clonedElements.forEach((c) => newlyCreatedIds.push(c.id));
              updatedScene.push(...clonedElements);
              break;
            }

            case "delete": {
              const targetId = actionItem.targetId
                ? createdIdMap.get(actionItem.targetId) || actionItem.targetId
                : null;

              updatedScene = updatedScene.filter((el) =>
                targetId ? el.id !== targetId : !selectedIds.includes(el.id)
              );
              break;
            }

            case "clear_canvas": {
              updatedScene = [];
              break;
            }

            case "select_all": {
              const allSelected: Record<string, boolean> = {};
              updatedScene.forEach((el) => {
                allSelected[el.id] = true;
              });
              excalidrawAPI.updateScene({
                appState: { selectedElementIds: allSelected },
              });
              break;
            }
          }
        }

        // ── Single Atomic Batched Commit (Non-Blocking Zero-Lag) ─────────────
        const newSelectedMap: Record<string, boolean> = {};
        newlyCreatedIds.forEach((id) => {
          newSelectedMap[id] = true;
        });

        // Request animation frame to prevent micro-stutter on heavy canvases
        requestAnimationFrame(() => {
          try {
            excalidrawAPI.updateScene({
              elements: updatedScene,
              ...(newlyCreatedIds.length > 0
                ? { appState: { selectedElementIds: newSelectedMap } }
                : {}),
              commitToHistory: true,
            });

            // Smoothly auto-scroll to new element if created
            if (newlyCreatedIds.length > 0 && typeof excalidrawAPI.scrollToContent === "function") {
              const targetElements = updatedScene.filter((el) => newlyCreatedIds.includes(el.id));
              if (targetElements.length > 0) {
                excalidrawAPI.scrollToContent(targetElements, { fitToViewport: false });
              }
            }
          } catch (updateErr: any) {
            console.error("[VoiceAI] updateScene commit failure:", updateErr);
            pushToast("Failed to commit updates to canvas scene.", "error");
          }
        });
      } catch (err: any) {
        console.error("[VoiceAI] Canvas execution error:", err);
        pushToast(`Canvas execution error: ${err?.message || "Unknown error"}`, "error");
      }
    },
    [excalidrawAPI, pushToast]
  );

  // ── 6. Spoken Command Handler & Backend Dispatch ────────────────────────────
  const handleVoiceSubmission = async (spokenText: string) => {
    if (!spokenText.trim() || isProcessing) return;

    try {
      setIsProcessing(true);

      // Context extraction: capture highlighted elements
      const currentElements = excalidrawAPI?.getSceneElements?.() || [];
      const appState = excalidrawAPI?.getAppState?.() || {};
      const selectedIds = Object.keys(appState.selectedElementIds || {}).filter(
        (id) => appState.selectedElementIds[id]
      );

      const activeSelectedElements = currentElements
        .filter((el: any) => selectedIds.includes(el.id))
        .map((el: any) => ({
          id: el.id,
          type: el.type,
          width: el.width,
          height: el.height,
          strokeColor: el.strokeColor,
          backgroundColor: el.backgroundColor,
          text: el.text || el.label?.text || null,
        }));

      // Post to /api/voice-command with 8-second timeout
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          transcript: spokenText,
          userEmail,
          userId,
          selectedElements: activeSelectedElements,
        }),
      });

      clearTimeout(fetchTimeout);

      const data: VoiceCommandResponse = await res.json().catch(() => ({
        success: false,
        error: "Malformed response received from server",
        actions: [],
        tier: "free",
        isPro: false,
        rawTranscript: "",
      }));

      if (!res.ok || !data.success) {
        if (res.status === 403 && data.code === "UPGRADE_REQUIRED") {
          onOpenUpgradeModal?.();
          pushToast(data.error || "Free limit reached. Upgrade to PRO.", "warning");
          return;
        }
        throw new Error(data?.warning || (data as any)?.error || "Voice command understanding failed.");
      }

      const actions = Array.isArray(data.actions) ? data.actions : [];

      if (actions.length === 0) {
        console.warn("[VoiceAI] Zero valid actions received from server payload:", data);
        pushToast(
          "Voice AI could not recognize a valid canvas action. Please try again (e.g. 'draw a blue rectangle').",
          "error"
        );
        return;
      }

      setRecognizedActions(actions);

      // Execute on Excalidraw
      await executeActionsOnCanvas(actions);

      // Feedback Toasts
      if (data.requiresProForMultiStep) {
        pushToast(
          "⚡ Executed 1st action. Upgrade to PRO to unlock multi-step chained actions!",
          "warning"
        );
      } else {
        const count = actions.length;
        pushToast(
          `✨ Executed ${count} ${count > 1 ? "canvas actions" : "action"} in ${data.latencyMs || 150}ms!`,
          "success"
        );
      }

      // If user is FREE (or not in continuous mode), automatically turn off mic
      if (!isPro || !continuousMode) {
        stopListening();
      }
    } catch (err: any) {
      console.warn("[VoiceAI] Command parse notice:", err);
      const isAbort = err?.name === "AbortError";
      pushToast(
        isAbort
          ? "Request timed out. Please check your internet connection."
          : err?.message || "Failed to process command. Please speak clearly.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 7. Mic Toggle Controls ──────────────────────────────────────────────────
  const startListening = () => {
    if (!speechSupported) {
      pushToast("Speech Recognition is not supported in this browser. Use Chrome or Edge.", "error");
      return;
    }

    try {
      recognitionStoppingRef.current = false;
      setLiveTranscript("");
      setRecognizedActions([]);
      recognitionRef.current?.start();
    } catch (err) {
      console.warn("[VoiceAI] Speech start notice:", err);
    }
  };

  const stopListening = () => {
    recognitionStoppingRef.current = true;
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleContinuousMode = () => {
    if (!isPro) {
      onOpenUpgradeModal?.();
      pushToast("🔒 Continuous Dictation Mode is an exclusive PRO superpower!", "warning");
      return;
    }
    const nextVal = !continuousMode;
    setContinuousMode(nextVal);
    isContinuousRef.current = nextVal;
    if (nextVal && !isListening) {
      startListening();
    }
  };

  if (!isOpen) return null;

  // ── 8. Render Cyberpunk Glassmorphic Voice AI Panel ─────────────────────────
  return (
    <>
      {/* ── Floating Toast Stack (z-[110]) ── */}
      <div className="fixed top-6 right-6 z-[110] flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border backdrop-blur-xl shadow-2xl text-xs font-mono leading-snug transition-all ${
                toast.type === "error"
                  ? "bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-900/40"
                  : toast.type === "warning"
                  ? "bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-900/40"
                  : toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-900/40"
                  : "bg-zinc-950/90 border-cyan-500/40 text-cyan-200 shadow-cyan-900/40"
              }`}
            >
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === "warning" && <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === "info" && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}

              <span className="flex-1">{toast.message}</span>

              <button
                onClick={() => dismissToast(toast.id)}
                className="text-zinc-400 hover:text-white p-0.5 rounded transition"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Main Voice AI Floating Center (z-[105]) ── */}
      <div
        className={`fixed bottom-6 right-6 z-[105] pointer-events-auto select-none transition-all duration-300 ${className}`}
        role="region"
        aria-label="Voice AI Command Center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border transition-all duration-300 shadow-2xl text-white overflow-hidden ${
            isListening
              ? "border-cyan-400 shadow-[0_0_40px_rgba(0,245,255,0.4)]"
              : "border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
          } ${isMinimized ? "w-72 p-3" : "w-[340px] sm:w-[410px] p-4 sm:p-5"}`}
        >
          {/* Ambient Cyber Neon Glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

          {/* ── Top Header Row ── */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div
                className={`relative w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                  isListening
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,245,255,0.5)]"
                    : "bg-white/5 border-white/10 text-zinc-400"
                }`}
              >
                <Mic className={`w-4 h-4 ${isListening ? "text-cyan-400 animate-pulse" : ""}`} />
                {isListening && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs tracking-wide text-white">
                    VOICE AI STUDIO
                  </span>
                  {/* PRO vs FREE Tier Badge */}
                  {isPro ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-gradient-to-r from-cyan-400/25 to-blue-500/25 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                      <Crown className="w-2.5 h-2.5 fill-cyan-300" />
                      PRO
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenUpgradeModal}
                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                      title="Click to unlock PRO Voice features"
                    >
                      FREE
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {isPro ? "Multi-Step & Continuous Dictation" : "Single-Step Execution"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Help Button */}
              <button
                type="button"
                onClick={() => setShowCheatsheet((prev) => !prev)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                title="Voice Commands Guide"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {/* Minimize Toggle */}
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-zinc-400 flex items-center justify-center transition-colors"
                  title="Close Panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Main Voice Body (Hidden when minimized) ── */}
          {!isMinimized && (
            <div className="pt-3 space-y-3">
              {/* Audio Equalizer Waveform & Status Bar */}
              <div className="relative p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 overflow-hidden">
                <div className="flex items-center gap-2.5">
                  {/* Equalizer bars */}
                  <div className="flex items-end gap-0.5 h-4">
                    <span
                      className={`w-1 rounded-full bg-cyan-400 transition-all duration-150 ${
                        isListening ? "h-4 animate-pulse" : "h-1.5 opacity-40"
                      }`}
                    />
                    <span
                      className={`w-1 rounded-full bg-cyan-300 transition-all duration-150 ${
                        isListening ? "h-3 animate-pulse delay-75" : "h-2 opacity-40"
                      }`}
                    />
                    <span
                      className={`w-1 rounded-full bg-indigo-400 transition-all duration-150 ${
                        isListening ? "h-4 animate-pulse delay-150" : "h-1 opacity-40"
                      }`}
                    />
                    <span
                      className={`w-1 rounded-full bg-pink-400 transition-all duration-150 ${
                        isListening ? "h-2.5 animate-pulse delay-100" : "h-1.5 opacity-40"
                      }`}
                    />
                  </div>

                  <span className="text-xs font-mono font-medium text-zinc-300">
                    {isProcessing
                      ? "Synthesizing Actions..."
                      : isListening
                      ? "Mic Active • Speak Command"
                      : "Mic Off"}
                  </span>
                </div>

                {/* PRO Continuous Mode Toggle Pill */}
                <button
                  type="button"
                  onClick={toggleContinuousMode}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    continuousMode
                      ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,245,255,0.3)]"
                      : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                  }`}
                  title={
                    isPro
                      ? "Continuous Mode: Mic stays on automatically"
                      : "PRO superpower: Keep mic on for uninterrupted fluid dictation"
                  }
                >
                  <Flame
                    className={`w-3 h-3 ${
                      continuousMode ? "text-cyan-400 fill-cyan-400" : "text-zinc-500"
                    }`}
                  />
                  <span>Continuous {continuousMode ? "ON" : "OFF"}</span>
                  {!isPro && <Crown className="w-2.5 h-2.5 text-amber-400" />}
                </button>
              </div>

              {/* Live Transcript Display Box */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 min-h-[58px] flex flex-col justify-center">
                {liveTranscript ? (
                  <p className="text-xs font-mono text-cyan-200 leading-relaxed break-words">
                    &ldquo;{liveTranscript}&rdquo;
                  </p>
                ) : (
                  <p className="text-[11px] font-mono text-zinc-500 italic">
                    {isPro
                      ? 'Try: "Draw a red circle, make it bigger, and copy it"'
                      : 'Try: "Draw a cyan rectangle" or "Draw a circle"'}
                  </p>
                )}
              </div>

              {/* Sequential Actions Execution Chips Preview */}
              <AnimatePresence>
                {recognizedActions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Sequential Steps:</span>
                      <span className="text-cyan-400 font-bold">
                        {recognizedActions.length} action(s)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {recognizedActions.map((act, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,245,255,0.15)]"
                        >
                          <span className="font-bold text-white">#{index + 1}</span>
                          <span>
                            {act.action.replace("_", " ").toUpperCase()}:{" "}
                            {act.shape || act.text || act.color || `${act.scale || 1}x`}
                          </span>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Main Mic Trigger Button ── */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={isProcessing || !speechSupported}
                  className={`w-full py-3 px-4 rounded-2xl font-mono text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50 ${
                    isListening
                      ? "bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.5)] scale-[1.01]"
                      : "bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black shadow-[0_0_25px_rgba(0,245,255,0.45)] hover:scale-[1.01]"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-current" />
                      <span>Parsing with AI...</span>
                    </>
                  ) : isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Start Voice Command</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Collapsed Quick Bar View ── */}
          {isMinimized && (
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`flex-1 py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : "bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,245,255,0.4)]"
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>{isListening ? "Listening…" : "Start Mic"}</span>
              </button>
            </div>
          )}

          {/* ── Cheatsheet Modal Drawer (z-[120]) ── */}
          <AnimatePresence>
            {showCheatsheet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-3 p-3 rounded-2xl bg-[#09090b]/98 border border-white/15 text-xs font-mono space-y-2 max-h-56 overflow-y-auto custom-scrollbar shadow-2xl"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-bold text-cyan-300 uppercase text-[10px]">
                    Voice Command Cheatsheet
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCheatsheet(false)}
                    className="p-1 hover:text-white text-zinc-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px] text-zinc-300">
                  <div>
                    <span className="text-cyan-400 font-bold">1. Shapes &amp; Text:</span>{" "}
                    &quot;Draw a rectangle&quot;, &quot;Draw a circle&quot;, &quot;Add text System Architecture&quot;
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">2. Selection Context:</span>{" "}
                    &quot;Make this 2x larger&quot;, &quot;Color this emerald&quot;, &quot;Duplicate this&quot;
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">3. Multi-Step (PRO):</span>{" "}
                    &quot;Draw a red circle, make it bigger, and copy it&quot;
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">4. Canvas Actions:</span>{" "}
                    &quot;Select all&quot;, &quot;Delete selection&quot;, &quot;Clear canvas&quot;
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}

// ── Export Wrapped in React ErrorBoundary ─────────────────────────────────────
export function VoiceAIPanel(props: VoiceAIPanelProps) {
  return (
    <VoiceAIErrorBoundary>
      <VoiceAIPanelInner {...props} />
    </VoiceAIErrorBoundary>
  );
}

export default VoiceAIPanel;
