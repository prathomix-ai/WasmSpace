"use client";

import React, { useState } from "react";
import HubNavigation from "@/components/HubNavigation";
import {
  User,
  Palette,
  Grid,
  Sparkles,
  Bell,
  Users,
  Shield,
  Keyboard,
  Save,
  CheckCircle2,
  Moon,
  Laptop,
} from "lucide-react";

type SettingsSection =
  | "general"
  | "appearance"
  | "canvas"
  | "shortcuts"
  | "notifications"
  | "collaboration"
  | "ai"
  | "privacy"
  | "account";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings states
  const [displayName, setDisplayName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex.rivera@masmspace.io");
  const [themeMode, setThemeMode] = useState<"dark" | "system">("dark");
  const [gridType, setGridType] = useState<"dots" | "lines" | "solid">("dots");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [smartGuides, setSmartGuides] = useState(true);
  const [defaultZoom, setDefaultZoom] = useState("100%");
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [aiConfirmChanges, setAiConfirmChanges] = useState(true);
  const [notifSharing, setNotifSharing] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navItems: { id: SettingsSection; label: string; icon: any }[] = [
    { id: "general", label: "General", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "canvas", label: "Canvas", icon: Grid },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "collaboration", label: "Collaboration", icon: Users },
    { id: "ai", label: "AI / Board Brain", icon: Sparkles },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F4F4F5] flex flex-col font-sans select-none">
      <HubNavigation currentTab="settings" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#171719] border border-[#2A2A2F] px-4 py-2 rounded-lg text-xs shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">
            Settings
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Manage your workspace preferences, canvas behavior, shortcuts, and AI configuration.
          </p>
        </div>

        {/* 2-Column Settings Layout */}
        <div className="flex flex-col md:flex-row items-start gap-6 bg-[#171719] border border-[#2A2A2F] rounded-xl p-5">
          {/* Left Navigation Sidebar */}
          <aside className="w-full md:w-52 shrink-0 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-semibold"
                      : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C1F]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <section className="flex-1 w-full border-t md:border-t-0 md:border-l border-[#2A2A2F] md:pl-6 pt-4 md:pt-0">
            {/* 1. General */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">General Preferences</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Basic profile and workspace identity.</p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md bg-[#111113] border border-[#2A2A2F] text-xs text-[#F4F4F5] outline-none focus:border-[#7C6CFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3 py-1.5 rounded-md bg-[#111113]/50 border border-[#2A2A2F] text-xs text-[#71717A] cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast("General preferences updated")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#7C6CFF] text-white text-xs font-medium hover:bg-[#635BFF] transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Appearance */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Theme & Visual System</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">MasmSpace refined dark visual architecture.</p>
                </div>

                <div className="space-y-3 max-w-md">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeMode("dark")}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        themeMode === "dark"
                          ? "bg-[#111113] border-[#7C6CFF] text-[#F4F4F5]"
                          : "bg-[#111113] border-[#2A2A2F] text-[#A1A1AA]"
                      }`}
                    >
                      <Moon className="w-4 h-4 text-[#7C6CFF] mb-2" />
                      <div className="text-xs font-medium">Refined Dark</div>
                      <div className="text-[11px] text-[#71717A] mt-0.5">#0D0D0F palette</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeMode("system")}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        themeMode === "system"
                          ? "bg-[#111113] border-[#7C6CFF] text-[#F4F4F5]"
                          : "bg-[#111113] border-[#2A2A2F] text-[#A1A1AA]"
                      }`}
                    >
                      <Laptop className="w-4 h-4 text-[#A1A1AA] mb-2" />
                      <div className="text-xs font-medium">System Sync</div>
                      <div className="text-[11px] text-[#71717A] mt-0.5">Follow OS mode</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Canvas */}
            {activeSection === "canvas" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Canvas Engine Parameters</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Grid, snapping, and layout guidelines.</p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Grid Style</label>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {(["dots", "lines", "solid"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGridType(g)}
                          className={`py-1.5 rounded-md border capitalize cursor-pointer transition-colors ${
                            gridType === g
                              ? "bg-[#7C6CFF]/20 border-[#7C6CFF] text-[#7C6CFF] font-medium"
                              : "bg-[#111113] border-[#2A2A2F] text-[#A1A1AA] hover:text-[#F4F4F5]"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-medium text-[#F4F4F5] block">Snap to Grid</span>
                        <span className="text-[11px] text-[#71717A]">Align objects to 8px intervals</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={snapToGrid}
                        onChange={(e) => setSnapToGrid(e.target.checked)}
                        className="rounded bg-[#111113] border-[#2A2A2F] text-[#7C6CFF] focus:ring-0"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-medium text-[#F4F4F5] block">Smart Alignment Guides</span>
                        <span className="text-[11px] text-[#71717A]">Show dynamic red/blue guides during drag</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={smartGuides}
                        onChange={(e) => setSmartGuides(e.target.checked)}
                        className="rounded bg-[#111113] border-[#2A2A2F] text-[#7C6CFF] focus:ring-0"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast("Canvas parameters saved")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#7C6CFF] text-white text-xs font-medium hover:bg-[#635BFF] transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Shortcuts */}
            {activeSection === "shortcuts" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Keyboard Shortcuts</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Quickly trigger tools and layout actions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: "V", desc: "Select Tool" },
                    { key: "H / Space+Drag", desc: "Pan Hand Tool" },
                    { key: "P", desc: "Pen Tool" },
                    { key: "E", desc: "Eraser" },
                    { key: "C", desc: "Dynamic Connector" },
                    { key: "T", desc: "Add Text" },
                    { key: "R", desc: "Add Rectangle" },
                    { key: "S", desc: "Add Sticky Note" },
                    { key: "⌘Z", desc: "Undo" },
                    { key: "⌘⇧Z", desc: "Redo" },
                    { key: "⌘C / ⌘V", desc: "Copy / Paste" },
                    { key: "⌘D", desc: "Duplicate Selected" },
                    { key: "⌘K / /", desc: "Command Palette / AI" },
                    { key: "Backspace / Del", desc: "Delete Selected" },
                    { key: "Shift + 1", desc: "Fit to Screen" },
                    { key: "Esc", desc: "Deselect / Exit Presentation" },
                  ].map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between p-2 rounded-md bg-[#111113] border border-[#2A2A2F]"
                    >
                      <span className="text-[#A1A1AA]">{s.desc}</span>
                      <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-[#1C1C1F] border border-[#2A2A2F] text-[#F4F4F5]">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Notifications */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Notification Preferences</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Stay informed on collaborator edits and mentions.</p>
                </div>

                <div className="space-y-3 max-w-md">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-[#F4F4F5] block">Shared Board Invites</span>
                      <span className="text-[11px] text-[#71717A]">When a teammate invites you to a board</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSharing}
                      onChange={(e) => setNotifSharing(e.target.checked)}
                      className="rounded bg-[#111113] border-[#2A2A2F] text-[#7C6CFF] focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-[#F4F4F5] block">Mentions & Comments</span>
                      <span className="text-[11px] text-[#71717A]">When someone mentions your handle on a note</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifMentions}
                      onChange={(e) => setNotifMentions(e.target.checked)}
                      className="rounded bg-[#111113] border-[#2A2A2F] text-[#7C6CFF] focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 6. Collaboration */}
            {activeSection === "collaboration" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Live Collaboration</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Multiplayer presence and default sharing permissions.</p>
                </div>

                <div className="space-y-3 max-w-md text-xs text-[#A1A1AA]">
                  <div className="p-3 rounded-lg bg-[#111113] border border-[#2A2A2F]">
                    <div className="text-[#F4F4F5] font-medium mb-1">Default Link Permission</div>
                    <div className="text-[11px] text-[#71717A] mb-3">
                      New sharing links are generated with edit rights by default.
                    </div>
                    <select className="px-2.5 py-1 rounded bg-[#1C1C1F] border border-[#2A2A2F] text-xs text-[#F4F4F5] outline-none">
                      <option value="edit">Can edit</option>
                      <option value="view">Can view</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 7. AI / Board Brain */}
            {activeSection === "ai" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Board Brain AI</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Automated layout clean-up and architecture synthesis.</p>
                </div>

                <div className="space-y-3 max-w-md">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-[#F4F4F5] block">AI Auto-Suggestions</span>
                      <span className="text-[11px] text-[#71717A]">Propose connectors and system nodes while typing</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSuggestions}
                      onChange={(e) => setAiSuggestions(e.target.checked)}
                      className="rounded bg-[#111113] border-[#2A2A2F] text-[#7C6CFF] focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-[#F4F4F5] block">Confirm Destructive Changes</span>
                      <span className="text-[11px] text-[#71717A]">Require approval before AI reorganizes board nodes</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiConfirmChanges}
                      onChange={(e) => setAiConfirmChanges(e.target.checked)}
                      className="rounded bg-[#111113] border-[#2A2A2F] text-[#7C6CFF] focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 8. Privacy & Security */}
            {activeSection === "privacy" && (
              <div className="space-y-4 max-w-md">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Data Privacy</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Control how your diagrams and telemetry are stored.</p>
                </div>

                <div className="p-3 rounded-lg bg-[#111113] border border-[#2A2A2F] text-xs">
                  <div className="text-[#F4F4F5] font-medium mb-1">Local-First Storage</div>
                  <p className="text-[11px] text-[#71717A] leading-relaxed">
                    Diagram changes persist to local browser storage first before synchronizing with the cloud.
                  </p>
                </div>
              </div>
            )}

            {/* 9. Account */}
            {activeSection === "account" && (
              <div className="space-y-4 max-w-md">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">Account Management</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Manage session and subscription status.</p>
                </div>

                <div className="p-3 rounded-lg bg-[#111113] border border-[#2A2A2F] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A1A1AA]">Current Plan</span>
                    <span className="font-semibold text-[#7C6CFF]">Pro Plan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A1A1AA]">Member Since</span>
                    <span className="text-[#F4F4F5]">January 2026</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
