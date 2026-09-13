"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type VoiceStatus,
  type RecognizedCommand,
  type VoiceCommandRule,
} from "@/types/voiceControl";

interface VoiceControlWidgetProps {
  isListening: boolean;
  status: VoiceStatus;
  isSupported: boolean;
  liveTranscript: string;
  lastCommand: RecognizedCommand | null;
  history: RecognizedCommand[];
  rules: VoiceCommandRule[];
  onToggleListening: () => void;
  onSimulateCommand: (text: string) => void;
}

export default function VoiceControlWidget({
  isListening,
  status,
  isSupported,
  liveTranscript,
  lastCommand,
  rules,
  onToggleListening,
  onSimulateCommand,
}: VoiceControlWidgetProps) {
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onSimulateCommand(customInput.trim());
    setCustomInput("");
  };

  return (
    <>
      {/* ── Floating Voice Dock / Bar ───────────────────────────────── */}
      <div className="voice-control-dock glass p-3 bottom-20 md:bottom-6" role="region" aria-label="Voice Control Bar">
        {/* Mic Toggle Button */}
        <button
          className={`voice-mic-btn ${isListening ? "listening" : ""} ${
            !isSupported ? "unsupported" : ""
          }`}
          onClick={onToggleListening}
          disabled={!isSupported}
          title={
            !isSupported
              ? "Web Speech API not supported in this browser"
              : isListening
              ? "Stop listening"
              : "Activate Voice Commands"
          }
          aria-label={isListening ? "Deactivate microphone" : "Activate microphone"}
        >
          {isListening && (
            <span className="mic-pulse-ring" aria-hidden="true" />
          )}
          <span className="mic-icon">{isListening ? "🎙️" : "🎤"}</span>
        </button>

        {/* Status & Live Transcript */}
        <div className="voice-info">
          <div className="voice-status-row">
            <span className="voice-label">Voice Control</span>
            <span className={`voice-state-tag ${isListening ? "active" : ""}`}>
              {!isSupported
                ? "Not supported"
                : status === "permission_denied"
                ? "Mic blocked"
                : isListening
                ? "Listening…"
                : "Click to speak"}
            </span>
          </div>

          <div className="voice-transcript-display">
            {liveTranscript ? (
              <span className="transcript-live">&ldquo;{liveTranscript}&rdquo;</span>
            ) : lastCommand ? (
              <span className="transcript-last">
                ✓ Executed: <strong>{lastCommand.description}</strong>
              </span>
            ) : (
              <span className="transcript-placeholder">
                Try: &ldquo;draw rectangle&rdquo;, &ldquo;clear board&rdquo;, &ldquo;add note&rdquo;
              </span>
            )}
          </div>
        </div>

        {/* Cheatsheet / Info Button */}
        <button
          className="voice-help-btn"
          onClick={() => setShowCheatsheet(!showCheatsheet)}
          title="View voice commands guide"
          aria-label="View voice commands cheatsheet"
        >
          <span>💬</span>
          Commands
        </button>
      </div>

      {/* ── Cheatsheet & Command Simulator Modal ────────────────────── */}
      <AnimatePresence>
        {showCheatsheet && (
          <div
            className="cheatsheet-backdrop"
            onClick={() => setShowCheatsheet(false)}
          >
            <motion.div
              className="voice-cheatsheet-modal glass w-[95%] md:max-w-2xl mx-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-label="Voice commands reference guide"
            >
              <div className="modal-header">
                <div className="header-title-group">
                  <span className="modal-icon">🎙️</span>
                  <div>
                    <h2 className="modal-title">Voice Control Commands</h2>
                    <p className="modal-subtitle">
                      Speak hands-free or test with instant command chips below
                    </p>
                  </div>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setShowCheatsheet(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Quick Simulator Input */}
              <form onSubmit={handleCustomSubmit} className="voice-sim-form">
                <input
                  type="text"
                  placeholder="Type a voice command to test (e.g., 'draw star', 'clear board')..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="voice-sim-input"
                  aria-label="Simulate voice command"
                />
                <button type="submit" className="voice-sim-btn">
                  Simulate
                </button>
              </form>

              {/* Quick clickable chips for testing */}
              <div className="quick-chips-section">
                <span className="section-label">Quick Test Chips:</span>
                <div className="chips-container">
                  {[
                    "draw rectangle",
                    "draw circle",
                    "draw star",
                    "draw triangle",
                    "draw diamond",
                    "draw arrow",
                    "add note Sprint Goals",
                    "add text MasmSpace Canvas",
                    "open code",
                    "zoom in",
                    "zoom to fit",
                    "undo",
                    "clear board",
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      className="command-chip"
                      onClick={() => {
                        onSimulateCommand(phrase);
                        setShowCheatsheet(false);
                      }}
                    >
                      ⚡ {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commands Catalog Table */}
              <div className="commands-list">
                {rules.map((rule) => (
                  <div key={rule.intent} className="command-rule-row">
                    <div className="rule-info">
                      <span className="rule-title">{rule.title}</span>
                      <span className="rule-desc">{rule.description}</span>
                    </div>
                    <div className="rule-examples">
                      {rule.examples.map((ex) => (
                        <code
                          key={ex}
                          className="example-pill"
                          onClick={() => {
                            onSimulateCommand(ex.replace(/"/g, ""));
                            setShowCheatsheet(false);
                          }}
                          title="Click to test this command"
                        >
                          {ex}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
