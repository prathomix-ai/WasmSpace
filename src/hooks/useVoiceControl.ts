"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  type VoiceStatus,
  type RecognizedCommand,
  type VoiceCommandRule,
} from "@/types/voiceControl";

export const VOICE_RULES: VoiceCommandRule[] = [
  {
    intent: "CLEAR_BOARD",
    title: "Clear Canvas",
    description: "Clears all shapes and drawings from the board",
    examples: ['"clear board"', '"clear canvas"', '"delete all"'],
    patterns: [
      /(?:clear|erase)\s+(?:the\s+)?(?:board|canvas)/i,
      /delete\s+all(?:\s+shapes)?/i,
      /wipe\s+(?:the\s+)?(?:board|canvas)/i,
    ],
    actionDescription: "Cleared canvas",
  },
  {
    intent: "DRAW_RECTANGLE",
    title: "Draw Rectangle",
    description: "Places a styled rectangle at the center of the canvas",
    examples: ['"draw rectangle"', '"create box"', '"add rectangle"'],
    patterns: [
      /(?:draw|create|make|add|insert)\s+(?:a\s+)?(?:rectangle|box|square)/i,
      /^rectangle$/i,
      /^box$/i,
    ],
    actionDescription: "Created rectangle",
  },
  {
    intent: "DRAW_CIRCLE",
    title: "Draw Circle",
    description: "Places an ellipse/circle on the canvas",
    examples: ['"draw circle"', '"create ellipse"', '"add circle"'],
    patterns: [
      /(?:draw|create|make|add|insert)\s+(?:a\s+)?(?:circle|ellipse|round)/i,
      /^circle$/i,
      /^ellipse$/i,
    ],
    actionDescription: "Created circle",
  },
  {
    intent: "DRAW_TRIANGLE",
    title: "Draw Triangle",
    description: "Places a geometric triangle on the canvas",
    examples: ['"draw triangle"', '"add triangle"'],
    patterns: [/(?:draw|create|make|add)\s+(?:a\s+)?triangle/i, /^triangle$/i],
    actionDescription: "Created triangle",
  },
  {
    intent: "DRAW_STAR",
    title: "Draw Star",
    description: "Places a star shape on the canvas",
    examples: ['"draw star"', '"add star"'],
    patterns: [/(?:draw|create|make|add)\s+(?:a\s+)?star/i, /^star$/i],
    actionDescription: "Created star",
  },
  {
    intent: "DRAW_DIAMOND",
    title: "Draw Diamond",
    description: "Places a diamond / decision node on the canvas",
    examples: ['"draw diamond"', '"add diamond"'],
    patterns: [/(?:draw|create|make|add)\s+(?:a\s+)?diamond/i, /^diamond$/i],
    actionDescription: "Created diamond",
  },
  {
    intent: "DRAW_ARROW",
    title: "Draw Arrow",
    description: "Places a directional arrow on the canvas",
    examples: ['"draw arrow"', '"add arrow"'],
    patterns: [/(?:draw|create|make|add)\s+(?:an?\s+)?arrow/i, /^arrow$/i],
    actionDescription: "Created arrow",
  },
  {
    intent: "ADD_NOTE",
    title: "Add Sticky Note",
    description: "Creates a sticky note with spoken content",
    examples: ['"sticky note brainstorm"', '"add note architecture review"'],
    patterns: [
      /(?:add|create|make|new)\s+(?:sticky\s+)?note(?:\s+(?:called|with|saying|about))?\s*(.*)/i,
      /sticky\s+note\s*(.*)/i,
    ],
    actionDescription: "Added sticky note",
  },
  {
    intent: "ADD_TEXT",
    title: "Add Text",
    description: "Places a text block with spoken words",
    examples: ['"add text Hello World"', '"write meeting notes"'],
    patterns: [
      /(?:add|write|type|insert)\s+(?:text|title|heading)(?:\s+(?:called|with|saying))?\s*(.*)/i,
    ],
    actionDescription: "Added text block",
  },
  {
    intent: "ZOOM_IN",
    title: "Zoom In",
    description: "Zooms closer into the canvas view",
    examples: ['"zoom in"', '"magnify"'],
    patterns: [/zoom\s+in/i, /^magnify$/i],
    actionDescription: "Zoomed in",
  },
  {
    intent: "ZOOM_OUT",
    title: "Zoom Out",
    description: "Zooms out for an overview",
    examples: ['"zoom out"'],
    patterns: [/zoom\s+out/i],
    actionDescription: "Zoomed out",
  },
  {
    intent: "ZOOM_FIT",
    title: "Zoom to Fit",
    description: "Fits all drawings neatly on screen",
    examples: ['"zoom to fit"', '"reset zoom"', '"fit screen"'],
    patterns: [/zoom\s+(?:to\s+)?fit/i, /reset\s+zoom/i, /fit\s+(?:to\s+)?screen/i],
    actionDescription: "Zoomed to fit all shapes",
  },
  {
    intent: "UNDO",
    title: "Undo",
    description: "Reverts the last action",
    examples: ['"undo"', '"revert"'],
    patterns: [/^undo$/i, /^revert$/i, /undo\s+that/i],
    actionDescription: "Undo performed",
  },
  {
    intent: "REDO",
    title: "Redo",
    description: "Restores reverted action",
    examples: ['"redo"'],
    patterns: [/^redo$/i, /redo\s+that/i],
    actionDescription: "Redo performed",
  },
  {
    intent: "SELECT_ALL",
    title: "Select All",
    description: "Selects all elements on the canvas",
    examples: ['"select all"', '"select everything"'],
    patterns: [/select\s+all/i, /select\s+everything/i],
    actionDescription: "Selected all shapes",
  },
  {
    intent: "DELETE_SELECTION",
    title: "Delete Selected",
    description: "Removes currently selected shapes",
    examples: ['"delete"', '"remove selected"'],
    patterns: [/^delete$/i, /^remove$/i, /delete\s+selected/i, /remove\s+selected/i],
    actionDescription: "Deleted selected shapes",
  },
  {
    intent: "TOGGLE_CODE_WIDGET",
    title: "Toggle Python Code",
    description: "Opens or closes the Code-on-Board Pyodide widget",
    examples: ['"open code"', '"python code"', '"close code"'],
    patterns: [
      /(?:open|close|toggle|show|hide)\s+(?:the\s+)?(?:code|python|editor|terminal)/i,
      /^python$/i,
      /^code$/i,
    ],
    actionDescription: "Toggled Code-on-Board widget",
  },
  {
    intent: "TRIGGER_SUMMARY",
    title: "AI Summarize",
    description: "Invokes the Board Brain AI to summarize canvas contents",
    examples: ['"summarize board"', '"board brain"', '"ai summary"'],
    patterns: [
      /(?:summarize|summarise)\s+(?:the\s+)?(?:board|canvas)/i,
      /board\s+brain/i,
      /ai\s+summary/i,
    ],
    actionDescription: "Triggered AI Summary",
  },
];

export interface UseVoiceControlEvents {
  onClearBoard?: () => void;
  onDrawShape?: (geo: string) => void;
  onAddNote?: (text: string) => void;
  onAddText?: (text: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDeleteSelection?: () => void;
  onToggleCodeWidget?: () => void;
  onTriggerSummary?: () => void;
}

export function useVoiceControl(events: UseVoiceControlEvents) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [lastCommand, setLastCommand] = useState<RecognizedCommand | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [history, setHistory] = useState<RecognizedCommand[]>([]);

  const recognitionRef = useRef<any>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  // Classify spoken text into an intent
  const classifyIntent = useCallback((transcript: string): RecognizedCommand | null => {
    const cleanText = transcript.trim();
    if (!cleanText) return null;

    for (const rule of VOICE_RULES) {
      for (const pattern of rule.patterns) {
        const match = cleanText.match(pattern);
        if (match) {
          const payload = match[1]?.trim() || match[2]?.trim() || "";
          return {
            id: Math.random().toString(36).slice(2, 9),
            transcript: cleanText,
            intent: rule.intent,
            description: rule.actionDescription,
            payload: payload || undefined,
            confidence: 0.95,
            timestamp: new Date().toLocaleTimeString(),
          };
        }
      }
    }

    return null;
  }, []);

  // Execute recognized intent against the canvas
  const executeIntent = useCallback((cmd: RecognizedCommand) => {
    const e = eventsRef.current;
    switch (cmd.intent) {
      case "CLEAR_BOARD":
        e.onClearBoard?.();
        break;
      case "DRAW_RECTANGLE":
        e.onDrawShape?.("rectangle");
        break;
      case "DRAW_CIRCLE":
        e.onDrawShape?.("ellipse");
        break;
      case "DRAW_TRIANGLE":
        e.onDrawShape?.("triangle");
        break;
      case "DRAW_STAR":
        e.onDrawShape?.("star");
        break;
      case "DRAW_DIAMOND":
        e.onDrawShape?.("diamond");
        break;
      case "DRAW_ARROW":
        e.onDrawShape?.("arrow-right");
        break;
      case "ADD_NOTE":
        e.onAddNote?.(cmd.payload || "Spoken Idea");
        break;
      case "ADD_TEXT":
        e.onAddText?.(cmd.payload || "Spoken Note");
        break;
      case "ZOOM_IN":
        e.onZoomIn?.();
        break;
      case "ZOOM_OUT":
        e.onZoomOut?.();
        break;
      case "ZOOM_FIT":
        e.onZoomFit?.();
        break;
      case "UNDO":
        e.onUndo?.();
        break;
      case "REDO":
        e.onRedo?.();
        break;
      case "SELECT_ALL":
        e.onSelectAll?.();
        break;
      case "DELETE_SELECTION":
        e.onDeleteSelection?.();
        break;
      case "TOGGLE_CODE_WIDGET":
        e.onToggleCodeWidget?.();
        break;
      case "TRIGGER_SUMMARY":
        e.onTriggerSummary?.();
        break;
    }
  }, []);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setIsSupported(false);
      setStatus("unsupported");
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setStatus("listening");
      setIsListening(true);
    };

    let lastTranscriptUpdate = 0;
    let transcriptThrottleTimer: ReturnType<typeof setTimeout> | null = null;

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      if (finalTranscript) {
        // Clear any pending interim throttle timer and commit final transcript immediately
        if (transcriptThrottleTimer) {
          clearTimeout(transcriptThrottleTimer);
          transcriptThrottleTimer = null;
        }
        setLiveTranscript(finalTranscript);

        const cmd = classifyIntent(finalTranscript);
        if (cmd) {
          setLastCommand(cmd);
          setHistory((prev) => [cmd, ...prev.slice(0, 9)]);
          executeIntent(cmd);
        }
        setTimeout(() => setLiveTranscript(""), 1200);
      } else if (interim) {
        // Throttle interim updates to >= 100ms to avoid React re-render thrashing on low-end hardware
        const now = performance.now();
        if (now - lastTranscriptUpdate >= 100) {
          lastTranscriptUpdate = now;
          setLiveTranscript(interim);
        } else if (!transcriptThrottleTimer) {
          transcriptThrottleTimer = setTimeout(() => {
            setLiveTranscript(interim);
            lastTranscriptUpdate = performance.now();
            transcriptThrottleTimer = null;
          }, 100);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setStatus("permission_denied");
      } else {
        setStatus("error");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          setStatus("idle");
        }
      } else {
        setStatus("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (transcriptThrottleTimer) {
        clearTimeout(transcriptThrottleTimer);
      }
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [classifyIntent, executeIntent, isListening]);

  // Start listening
  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setIsSupported(false);
      setStatus("unsupported");
      return;
    }

    // Wrap the microphone request in a try...catch block
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (micErr) {
      console.warn("[useVoiceControl] Microphone access denied:", micErr);
      setStatus("permission_denied");
      setIsListening(false);
      return;
    }

    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setStatus("listening");
    } catch {
      // already started
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus("idle");
      setLiveTranscript("");
    } catch {
      // ignore
    }
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Simulate command (for manual testing or environments without mic)
  const simulateCommand = useCallback(
    (text: string) => {
      setLiveTranscript(text);
      const cmd = classifyIntent(text);
      if (cmd) {
        setLastCommand(cmd);
        setHistory((prev) => [cmd, ...prev.slice(0, 9)]);
        executeIntent(cmd);
      }
      setTimeout(() => setLiveTranscript(""), 1500);
      return cmd;
    },
    [classifyIntent, executeIntent]
  );

  return {
    status,
    isSupported,
    isListening,
    liveTranscript,
    lastCommand,
    history,
    startListening,
    stopListening,
    toggleListening,
    simulateCommand,
    rules: VOICE_RULES,
  };
}
