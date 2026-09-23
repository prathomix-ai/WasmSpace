'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, User, Palette, Grid, Sparkles, Bell, Users, Shield, 
  Lock, CreditCard, Keyboard, Plug, Save, CheckCircle2, 
  Trash2, AlertTriangle, ExternalLink, Sun, Moon, Laptop, Check
} from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData?: () => void;
  onOpenUpgradeModal?: () => void;
  onProUpgradeSuccess?: () => void;
  actionsUsed?: number;
  actionLimit?: number;
  tier?: string;
  autoSave?: boolean;
  onAutoSaveChange?: (val: boolean) => void;
  onGridTypeChange?: (val: 'dots' | 'lines' | 'solid') => void;
  onThemeChange?: (val: string) => void;
}

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

export function SettingsModal({
  isOpen,
  onClose,
  onClearAllData,
  onOpenUpgradeModal,
  actionsUsed = 8,
  actionLimit = 15,
  tier = 'free',
  autoSave = true,
  onAutoSaveChange,
  onGridTypeChange,
  onThemeChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex.rivera@masmspace.io');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [canvasBg, setCanvasBg] = useState<'warm' | 'neutral' | 'cool'>('warm');
  const [gridChoice, setGridChoice] = useState<'dots' | 'lines' | 'solid'>('dots');
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [smartGuides, setSmartGuides] = useState(true);
  const [infiniteCanvas, setInfiniteCanvas] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [aiConfirmChanges, setAiConfirmChanges] = useState(true);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E4E4E7] rounded-3xl w-full max-w-4xl h-[680px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAF9]">
          <div>
            <h2 className="text-base font-bold text-[#18181B]">Workspace Settings</h2>
            <p className="text-xs text-[#71717A]">MasmSpace preferences, canvas tools, and AI capacity</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#E4E4E7] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Nav */}
          <aside className="w-52 border-r border-[#E4E4E7] p-3 space-y-1 overflow-y-auto bg-[#FAFAF9]/50">
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
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Tab Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-[#18181B]">Account Details</h3>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#635BFF] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                    AR
                  </div>
                  <div>
                    <button 
                      onClick={() => showToast('Avatar updated')}
                      className="px-3 py-1.5 bg-white border border-[#E4E4E7] text-xs font-semibold rounded-xl hover:border-[#CBD5E1]"
                    >
                      Change Photo
                    </button>
                    <p className="text-[11px] text-[#A1A1AA] mt-1">256x256 PNG or JPG</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#18181B] block">Account Identifier</span>
                    <span className="text-[#71717A] font-mono text-[11px]">usr_94f8329b820a4b</span>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard?.writeText('usr_94f8329b820a4b'); showToast('ID copied'); }}
                    className="text-[#635BFF] font-semibold hover:underline"
                  >
                    Copy
                  </button>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] flex justify-between">
                  <button 
                    onClick={() => showToast('Profile updated')}
                    className="px-4 py-2 bg-[#635BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5248E5]"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-[#18181B]">Appearance & Tone</h3>

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
                          onClick={() => { setThemeMode(t.id as any); onThemeChange?.(t.id); showToast(`Theme: ${t.label}`); }}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                            themeMode === t.id ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF]' : 'border-[#E4E4E7] text-[#71717A]'
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
                  <label className="block text-xs font-semibold text-[#18181B] mb-2">Canvas Warmth</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'warm', label: 'Warm Off-White', color: '#FAFAF9' },
                      { id: 'neutral', label: 'Neutral Gray', color: '#F4F4F5' },
                      { id: 'cool', label: 'Cool Slate', color: '#F8FAFC' }
                    ].map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setCanvasBg(b.id as any); showToast('Canvas warmth set'); }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium ${
                          canvasBg === b.id ? 'border-[#635BFF] ring-1 ring-[#635BFF]' : 'border-[#E4E4E7]'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full border border-[#CBD5E1]" style={{ backgroundColor: b.color }} />
                        <span className="truncate text-[#18181B]">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CANVAS */}
            {activeTab === 'canvas' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-[#18181B]">Canvas Grid & Engine</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#18181B] mb-1">Grid Pattern</label>
                    <select
                      value={gridChoice}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setGridChoice(val);
                        onGridTypeChange?.(val);
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none"
                    >
                      <option value="dots">Subtle Dot Grid (Recommended)</option>
                      <option value="lines">Graph Lines</option>
                      <option value="solid">Blank Canvas</option>
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

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <span className="text-xs font-semibold text-[#18181B]">Snap Objects to Grid</span>
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <span className="text-xs font-semibold text-[#18181B]">Smart Alignment Guides</span>
                    <input
                      type="checkbox"
                      checked={smartGuides}
                      onChange={(e) => setSmartGuides(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <span className="text-xs font-semibold text-[#18181B]">Autosave Canvas Changes</span>
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => onAutoSaveChange?.(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI / BOARD BRAIN */}
            {activeTab === 'ai' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-[#18181B]">AI / Board Brain</h3>

                <div className="p-4 bg-white border border-[#E4E4E7] rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#18181B]">Plan: {tier === 'pro' ? 'Pro Tier' : 'Free Tier'}</span>
                        <p className="text-[11px] text-[#71717A]">Resets automatically every 12 hours</p>
                      </div>
                    </div>

                    {tier !== 'pro' && (
                      <button
                        onClick={onOpenUpgradeModal}
                        className="px-3 py-1.5 bg-[#635BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5248E5]"
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#18181B]">{actionsUsed} / {actionLimit} actions used</span>
                      <span className="text-[11px] text-[#71717A]">Resets in 7h 42m</span>
                    </div>
                    <div className="w-full h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#635BFF] rounded-full" 
                        style={{ width: `${Math.min(100, (actionsUsed / actionLimit) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <span className="text-xs font-semibold text-[#18181B]">Automated AI Suggestions</span>
                    <input
                      type="checkbox"
                      checked={aiSuggestions}
                      onChange={(e) => setAiSuggestions(e.target.checked)}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-[#E4E4E7] rounded-xl">
                    <span className="text-xs font-semibold text-[#18181B]">Confirm Before Applying Layout</span>
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

            {/* BILLING & PLANS */}
            {activeTab === 'billing' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-[#18181B]">Billing & Quotas</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FAFAF9] border-2 border-[#18181B] rounded-2xl">
                    <span className="text-[10px] font-bold uppercase text-[#71717A]">Free Tier</span>
                    <h4 className="text-base font-bold text-[#18181B] mt-1">15 actions / 12h</h4>
                    <p className="text-xs text-[#71717A] mt-1">Standard canvas nodes & templates.</p>
                  </div>

                  <div className="p-4 bg-[#635BFF]/5 border border-[#635BFF]/30 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#635BFF]">MasmSpace Pro</span>
                      <h4 className="text-base font-bold text-[#18181B] mt-1">150 actions / 12h</h4>
                      <p className="text-xs text-[#71717A] mt-1">$5/mo or $49/yr.</p>
                    </div>
                    <button
                      onClick={onOpenUpgradeModal}
                      className="mt-3 w-full py-1.5 bg-[#635BFF] text-white text-xs font-semibold rounded-xl hover:bg-[#5248E5]"
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-[#18181B]">Essential Canvas Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'V', desc: 'Select Tool' },
                    { key: 'H', desc: 'Hand / Pan' },
                    { key: 'P', desc: 'Pen Tool' },
                    { key: 'T', desc: 'Text Block' },
                    { key: 'R', desc: 'Rectangle' },
                    { key: 'N', desc: 'Sticky Note' },
                    { key: 'L', desc: 'Line' },
                    { key: 'A', desc: 'Arrow' },
                    { key: 'Ctrl + Z', desc: 'Undo' },
                    { key: 'Ctrl + Shift + Z', desc: 'Redo' },
                    { key: 'Ctrl + D', desc: 'Duplicate' },
                    { key: 'Delete', desc: 'Delete' }
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#FAFAF9] rounded-lg border border-[#E4E4E7]">
                      <span className="text-[#71717A]">{s.desc}</span>
                      <kbd className="px-1.5 py-0.5 bg-white border border-[#E4E4E7] font-mono text-[11px] font-bold rounded">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OTHER TABS FALLBACK */}
            {['notifications', 'collaboration', 'privacy', 'security', 'integrations'].includes(activeTab) && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-[#18181B] capitalize">{activeTab} Settings</h3>
                <p className="text-xs text-[#71717A]">Configure workspace parameters and collaborative policies.</p>
                <div className="p-4 bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl text-xs text-[#71717A]">
                  All defaults are active. Changes apply synchronously across active collaborative whiteboard sessions.
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <h4 className="text-sm font-bold text-[#18181B]">Delete Account Confirmation</h4>
              <p className="text-xs text-[#71717A] mt-1">Type <strong>DELETE</strong> to confirm permanent deletion.</p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full mt-3 px-3 py-2 border border-[#E4E4E7] rounded-xl text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs text-[#71717A] hover:bg-[#F4F4F5] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteInput !== 'DELETE'}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onClearAllData?.();
                    showToast('Account deleted');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold text-white rounded-xl ${
                    deleteInput === 'DELETE' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300'
                  }`}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-60 bg-[#18181B] text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}

export default SettingsModal;
