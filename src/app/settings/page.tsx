'use client';

import React, { useState, useEffect } from 'react';
import HubNavigation from '@/components/HubNavigation';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import { 
  User, Palette, Grid, Sparkles, Bell, Users, Shield, 
  Lock, CreditCard, Keyboard, Plug, Save, CheckCircle2, 
  Trash2, AlertTriangle, ExternalLink, RefreshCw, Moon, Sun, Laptop, Download
} from 'lucide-react';

type SettingsTab = 
  | 'account' 
  | 'appearance' 
  | 'canvas' 
  | 'ai' 
  | 'notifications' 
  | 'collaboration' 
  | 'privacy' 
  | 'security' 
  | 'billing' 
  | 'shortcuts' 
  | 'integrations';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [showProModal, setShowProModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex.rivera@masmspace.io');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [canvasBg, setCanvasBg] = useState<'warm' | 'neutral' | 'cool'>('warm');
  const [accentColor, setAccentColor] = useState('#635BFF');
  const [compactMode, setCompactMode] = useState(false);
  const [gridType, setGridType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [smartGuides, setSmartGuides] = useState(true);
  const [infiniteCanvas, setInfiniteCanvas] = useState(true);
  const [defaultZoom, setDefaultZoom] = useState('100%');
  const [defaultTool, setDefaultTool] = useState('select');

  // AI settings
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [aiHistory, setAiHistory] = useState(true);
  const [aiConfirmChanges, setAiConfirmChanges] = useState(true);
  const [actionsUsed, setActionsUsed] = useState(8);
  const actionLimit = 15; // Free plan

  // Notifications
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifSharing, setNotifSharing] = useState(true);
  const [notifAi, setNotifAi] = useState(true);
  const [deliveryEmail, setDeliveryEmail] = useState(true);

  // Privacy
  const [whoCanView, setWhoCanView] = useState('team');
  const [publicSharing, setPublicSharing] = useState(false);
  const [aiDataOptIn, setAiDataOptIn] = useState(false);

  // Security delete confirm
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navItems: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'canvas', label: 'Canvas', icon: Grid },
    { id: 'ai', label: 'AI / Board Brain', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'integrations', label: 'Integrations', icon: Plug }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="settings" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">Workspace Settings</h1>
          <p className="text-xs text-[#71717A] mt-1">Manage personal preferences, canvas engine parameters, AI quota, and team permissions.</p>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-8 bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-sm">
          {/* Compact Left Navigation */}
          <aside className="w-full md:w-56 shrink-0 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-[#635BFF]/10 text-[#635BFF]' 
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#635BFF]' : 'text-[#71717A]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 min-w-0 md:pl-6 md:border-l border-[#E4E4E7] space-y-6">
            
            {/* 1. ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Account Profile</h2>
                  <p className="text-xs text-[#71717A]">Update your public collaborator avatar and credentials.</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#635BFF] text-white font-bold text-xl flex items-center justify-center shadow-sm">
                    AR
                  </div>
                  <div>
                    <button 
                      onClick={() => showToast('Avatar updated')} 
                      className="px-3 py-1.5 bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] text-[#18181B] text-xs font-medium rounded-xl shadow-xs transition-colors"
                    >
                      Change Photo
                    </button>
                    <p className="text-[11px] text-[#A1A1AA] mt-1">Recommended: 256x256 PNG or JPG</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#18181B] block">Account ID</span>
                    <span className="text-[11px] text-[#71717A] font-mono">usr_94f8329b820a4b</span>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard?.writeText('usr_94f8329b820a4b'); showToast('Account ID copied'); }}
                    className="text-xs text-[#635BFF] font-semibold hover:underline"
                  >
                    Copy ID
                  </button>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-between">
                  <button 
                    onClick={() => showToast('Profile saved')}
                    className="px-4 py-2 bg-[#635BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5248E5] transition-all shadow-xs"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => showToast('Signed out of session')}
                    className="text-xs text-[#71717A] hover:text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="mt-8 pt-6 border-t border-red-100">
                  <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Danger Zone</h3>
                  <p className="text-xs text-[#71717A] mb-3">Permanently delete your account, whiteboards, comments, and uploaded assets.</p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Appearance</h2>
                  <p className="text-xs text-[#71717A]">Customize theme mode, canvas warmth, and UI density.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-2">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Laptop }
                    ].map(t => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => { setThemeMode(t.id as any); showToast(`Theme set to ${t.label}`); }}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                            themeMode === t.id 
                              ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF]' 
                              : 'border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-2">Canvas Background Tone</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'warm', label: 'Warm Off-White (#FAFAF9)', color: '#FAFAF9' },
                      { id: 'neutral', label: 'Neutral Gray (#F4F4F5)', color: '#F4F4F5' },
                      { id: 'cool', label: 'Cool Slate (#F8FAFC)', color: '#F8FAFC' }
                    ].map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setCanvasBg(b.id as any); showToast(`Canvas tone updated`); }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                          canvasBg === b.id 
                            ? 'border-[#635BFF] ring-1 ring-[#635BFF]' 
                            : 'border-[#E4E4E7] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full border border-[#CBD5E1]" style={{ backgroundColor: b.color }} />
                        <span className="truncate text-[#18181B]">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-[#18181B] block">Compact Toolbar Mode</span>
                    <span className="text-[11px] text-[#71717A]">Reduces floating bar padding for maximum vertical workspace.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => { setCompactMode(e.target.checked); showToast('Compact mode updated'); }}
                    className="w-4 h-4 accent-[#635BFF] rounded"
                  />
                </div>
              </div>
            )}

            {/* 3. CANVAS */}
            {activeTab === 'canvas' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Canvas Engine Parameters</h2>
                  <p className="text-xs text-[#71717A]">Configure grid guides, snapping behavior, and interaction defaults.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Grid Display</label>
                    <select
                      value={gridType}
                      onChange={(e) => setGridType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none"
                    >
                      <option value="dots">Subtle Dot Grid (Default)</option>
                      <option value="lines">Graph Lines</option>
                      <option value="none">Blank Canvas (No Grid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Grid Size ({gridSize}px)</label>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      step={5}
                      value={gridSize}
                      onChange={(e) => setGridSize(Number(e.target.value))}
                      className="w-full accent-[#635BFF] mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Snap to Grid</span>
                      <span className="text-[11px] text-[#71717A]">Automatically align dragged objects to nearest grid intersection.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Smart Alignment Guides</span>
                      <span className="text-[11px] text-[#71717A]">Show dynamic pink/blue guides when shapes align with neighboring nodes.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={smartGuides}
                      onChange={(e) => setSmartGuides(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Infinite Canvas Expansion</span>
                      <span className="text-[11px] text-[#71717A]">Allow zooming and panning infinitely in any 2D direction.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={infiniteCanvas}
                      onChange={(e) => setInfiniteCanvas(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7]">
                  <button 
                    onClick={() => showToast('Canvas settings saved')}
                    className="px-4 py-2 bg-[#635BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5248E5] transition-all shadow-xs"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* 4. AI / BOARD BRAIN */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">AI / Board Brain</h2>
                  <p className="text-xs text-[#71717A]">Monitor intelligent diagram synthesis quotas and generation preferences.</p>
                </div>

                {/* Quota Card */}
                <div className="p-4 bg-white border border-[#E4E4E7] rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#18181B]">Current Plan: Free Tier</span>
                        <p className="text-[11px] text-[#71717A]">Resets automatically every 12 hours</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowProModal(true)}
                      className="px-3 py-1.5 bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      Upgrade to Pro
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#18181B]">AI usage: {actionsUsed} / {actionLimit} actions used</span>
                      <span className="text-[11px] text-[#71717A] font-medium">Resets in 7h 42m</span>
                    </div>
                    <div className="w-full h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#635BFF] rounded-full transition-all duration-500" 
                        style={{ width: `${(actionsUsed / actionLimit) * 100}%` }} 
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl flex items-center justify-between text-xs text-[#71717A]">
                    <span>Pro users receive <strong>150 AI actions</strong> per 12 hours + advanced diagram synthesis.</span>
                    <button 
                      onClick={() => setShowProModal(true)}
                      className="text-[#635BFF] font-semibold hover:underline shrink-0 ml-2"
                    >
                      Learn more
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Contextual AI Suggestions</span>
                      <span className="text-[11px] text-[#71717A]">Offer automated next-step node recommendations while diagramming.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSuggestions}
                      onChange={(e) => setAiSuggestions(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Confirm Changes Before Canvas Insertion</span>
                      <span className="text-[11px] text-[#71717A]">Show interactive preview diff before placing AI-generated nodes.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiConfirmChanges}
                      onChange={(e) => setAiConfirmChanges(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Notification Preferences</h2>
                  <p className="text-xs text-[#71717A]">Choose what events trigger in-app toasts and team email digests.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Direct @mentions in comments', desc: 'When a collaborator tags your handle on a sticky or frame', checked: notifMentions, set: setNotifMentions },
                    { label: 'Comment replies & threads', desc: 'When someone replies to your active canvas comments', checked: notifComments, set: setNotifComments },
                    { label: 'Board sharing & permissions', desc: 'When you are invited to a new workspace or board', checked: notifSharing, set: setNotifSharing },
                    { label: 'AI generation completion', desc: 'When background diagram synthesis or summarization finishes', checked: notifAi, set: setNotifAi }
                  ].map((n, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-[#18181B] block">{n.label}</span>
                        <span className="text-[11px] text-[#71717A]">{n.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={n.checked}
                        onChange={(e) => n.set(e.target.checked)}
                        className="w-4 h-4 accent-[#635BFF] rounded"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-between p-3 bg-[#FAFAF9] rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-[#18181B] block">Email Summary Digest</span>
                    <span className="text-[11px] text-[#71717A]">Send a weekly highlights email of board updates and comments.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={deliveryEmail}
                    onChange={(e) => setDeliveryEmail(e.target.checked)}
                    className="w-4 h-4 accent-[#635BFF] rounded"
                  />
                </div>
              </div>
            )}

            {/* 6. COLLABORATION */}
            {activeTab === 'collaboration' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Live Collaboration</h2>
                  <p className="text-xs text-[#71717A]">Control multiplayer cursor presence, collaborator tags, and editing locks.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Show Realtime Collaborator Cursors</span>
                      <span className="text-[11px] text-[#71717A]">Display live colored cursor pointers and nametags of active editors.</span>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#635BFF] rounded" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Broadcast Viewport in Presentation Mode</span>
                      <span className="text-[11px] text-[#71717A]">Allow audience members to automatically follow the presenter&apos;s camera viewport.</span>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#635BFF] rounded" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Require Passcode for Public Links</span>
                      <span className="text-[11px] text-[#71717A]">Adds 6-digit access pin requirement for anyone with the public share link.</span>
                    </div>
                    <input type="checkbox" className="w-4 h-4 accent-[#635BFF] rounded" />
                  </div>
                </div>
              </div>
            )}

            {/* 7. PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Privacy & Data Governance</h2>
                  <p className="text-xs text-[#71717A]">Control how your canvas boards, assets, and metadata are shared.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Default Board Visibility</label>
                  <select
                    value={whoCanView}
                    onChange={(e) => setWhoCanView(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none"
                  >
                    <option value="private">Only Me (Strict Private)</option>
                    <option value="team">Team Workspace Members</option>
                    <option value="public">Anyone with link</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Allow AI Model Improvement</span>
                      <span className="text-[11px] text-[#71717A]">Anonymize board diagram topology to improve spatial layout models.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiDataOptIn}
                      onChange={(e) => setAiDataOptIn(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold text-[#18181B] block">Export Personal Archive</span>
                      <span className="text-[11px] text-[#71717A]">Download a comprehensive JSON package of all boards, notes, and uploaded files.</span>
                    </div>
                    <button 
                      onClick={() => showToast('Export bundle requested. Check your email.')}
                      className="px-3 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-xs font-medium rounded-xl transition-colors"
                    >
                      Request Export
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 8. SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Security & Sessions</h2>
                  <p className="text-xs text-[#71717A]">Manage authentication, 2FA tokens, and active browser sessions.</p>
                </div>

                <div className="p-4 bg-white border border-[#E4E4E7] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#18181B] block">Two-Factor Authentication (2FA)</span>
                      <span className="text-[11px] text-[#71717A]">Secure your account using Google Authenticator or 1Password.</span>
                    </div>
                    <button 
                      onClick={() => showToast('2FA setup triggered')}
                      className="px-3 py-1.5 bg-[#18181B] text-white text-xs font-medium rounded-xl hover:bg-black transition-colors"
                    >
                      Enable 2FA
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#E4E4E7] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#18181B] block">Active Session</span>
                      <span className="text-[11px] text-[#71717A]">Chrome on Windows 11 • New Delhi, IN (Current)</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active Now
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 9. BILLING & PLANS */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Billing & Plans</h2>
                  <p className="text-xs text-[#71717A]">View subscription plan, invoice history, and AI capacity.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Free Plan Box */}
                  <div className="p-4 bg-[#FAFAF9] border-2 border-[#18181B] rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Current Plan</span>
                    <h3 className="text-lg font-bold text-[#18181B] mt-1">MasmSpace Free</h3>
                    <p className="text-xs text-[#71717A] mt-1">15 AI actions every 12 hours. Unlimited basic canvas nodes.</p>
                    <div className="mt-4 text-xs font-bold text-[#18181B]">Free forever</div>
                  </div>

                  {/* Pro Plan Box */}
                  <div className="p-4 bg-[#635BFF]/5 border border-[#635BFF]/30 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF]">Recommended</span>
                        <span className="px-2 py-0.5 bg-[#635BFF] text-white text-[9px] font-bold rounded">PRO</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#18181B] mt-1">MasmSpace Pro</h3>
                      <p className="text-xs text-[#71717A] mt-1">150 AI actions / 12h, advanced diagramming, presentation recording.</p>
                      <div className="mt-2 text-xs font-bold text-[#18181B]">$5 / month</div>
                    </div>

                    <button
                      onClick={() => setShowProModal(true)}
                      className="mt-4 w-full py-2 bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>

                {/* Invoices */}
                <div>
                  <h3 className="text-xs font-bold text-[#18181B] mb-2">Invoice Receipts</h3>
                  <div className="p-4 bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl text-center text-xs text-[#71717A]">
                    No past invoices on Free tier. Receipts will appear here once subscribed.
                  </div>
                </div>
              </div>
            )}

            {/* 10. SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Keyboard Shortcuts</h2>
                  <p className="text-xs text-[#71717A]">Master spatial shortcuts for hyper-fast diagramming and navigation.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { key: 'V', desc: 'Select Tool' },
                    { key: 'H / Space', desc: 'Hand / Pan Canvas' },
                    { key: 'P', desc: 'Pen / Drawing' },
                    { key: 'T', desc: 'Text Block' },
                    { key: 'R', desc: 'Rectangle Shape' },
                    { key: 'N', desc: 'Sticky Note' },
                    { key: 'L', desc: 'Straight Line' },
                    { key: 'A', desc: 'Arrow Connector' },
                    { key: 'Ctrl + Z', desc: 'Undo Action' },
                    { key: 'Ctrl + Shift + Z', desc: 'Redo Action' },
                    { key: 'Ctrl + D', desc: 'Duplicate Selection' },
                    { key: 'Delete / Backspace', desc: 'Delete Selected' },
                    { key: 'Ctrl + K', desc: 'Open Board Brain AI' },
                    { key: 'Ctrl + /', desc: 'Toggle All Shortcuts' }
                  ].map((sc, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-[#E4E4E7] rounded-xl">
                      <span className="text-[#18181B] font-medium">{sc.desc}</span>
                      <kbd className="px-2 py-1 bg-[#F4F4F5] border border-[#E4E4E7] rounded-md font-mono text-[11px] font-semibold text-[#18181B]">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. INTEGRATIONS */}
            {activeTab === 'integrations' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">Connected Integrations</h2>
                  <p className="text-xs text-[#71717A]">Sync your whiteboard artifacts with GitHub, Figma, Slack, and Jira.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'GitHub', desc: 'Sync architecture diagrams directly into markdown repositories.', connected: true },
                    { name: 'Slack', desc: 'Receive real-time notifications for sticky notes and comment threads.', connected: false },
                    { name: 'Figma', desc: 'Import frame vectors and vector components into canvas.', connected: false },
                    { name: 'Linear', desc: 'Convert sticky notes directly into engineering sprint tasks.', connected: true }
                  ].map((integ, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-white border border-[#E4E4E7] rounded-xl">
                      <div>
                        <span className="text-xs font-bold text-[#18181B] block">{integ.name}</span>
                        <span className="text-[11px] text-[#71717A]">{integ.desc}</span>
                      </div>
                      {integ.connected ? (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          Connected
                        </span>
                      ) : (
                        <button 
                          onClick={() => showToast(`Connected to ${integ.name}`)}
                          className="px-3 py-1 bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] text-xs font-semibold text-[#18181B] rounded-lg transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#18181B]">Delete MasmSpace Account</h3>
            <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
              This action cannot be undone. All your boards, templates, project files, and collaboration history will be permanently deleted.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#71717A] hover:bg-[#F4F4F5] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  setShowDeleteModal(false);
                  showToast('Account deleted');
                }}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all ${
                  deleteConfirmText === 'DELETE' 
                    ? 'bg-red-600 hover:bg-red-700 shadow-sm' 
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureName="MasmSpace Pro"
      />
    </div>
  );
}
