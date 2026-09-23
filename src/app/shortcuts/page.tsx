'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HubNavigation from '@/components/HubNavigation';
import { 
  Keyboard, Search, MousePointer, Hand, Edit3, 
  Type, Square, StickyNote, ArrowRight, CornerDownLeft 
} from 'lucide-react';

interface Shortcut {
  key: string;
  action: string;
  category: 'Tools' | 'Canvas Navigation' | 'Editing & History' | 'Arrangement';
}

const SHORTCUTS: Shortcut[] = [
  // Tools
  { key: 'V', action: 'Select Tool', category: 'Tools' },
  { key: 'H', action: 'Hand / Pan Tool', category: 'Tools' },
  { key: 'P', action: 'Pen / Freehand Drawing', category: 'Tools' },
  { key: 'T', action: 'Text Block', category: 'Tools' },
  { key: 'R', action: 'Rectangle / Shape Tool', category: 'Tools' },
  { key: 'N', action: 'Sticky Note', category: 'Tools' },
  { key: 'L', action: 'Straight Line', category: 'Tools' },
  { key: 'A', action: 'Arrow Connector', category: 'Tools' },
  { key: 'E', action: 'Eraser', category: 'Tools' },
  { key: 'C', action: 'Comment Tool', category: 'Tools' },

  // Canvas Navigation
  { key: 'Space + Drag', action: 'Pan Canvas', category: 'Canvas Navigation' },
  { key: 'Ctrl + Scroll', action: 'Smooth Zoom In / Out', category: 'Canvas Navigation' },
  { key: 'Ctrl + 0', action: 'Zoom to 100%', category: 'Canvas Navigation' },
  { key: 'Ctrl + 1', action: 'Fit All Content on Screen', category: 'Canvas Navigation' },
  { key: 'Ctrl + 2', action: 'Zoom to Selection', category: 'Canvas Navigation' },

  // Editing & History
  { key: 'Ctrl + Z', action: 'Undo', category: 'Editing & History' },
  { key: 'Ctrl + Shift + Z', action: 'Redo', category: 'Editing & History' },
  { key: 'Ctrl + C', action: 'Copy Selected Elements', category: 'Editing & History' },
  { key: 'Ctrl + V', action: 'Paste Elements at Cursor', category: 'Editing & History' },
  { key: 'Ctrl + X', action: 'Cut Elements', category: 'Editing & History' },
  { key: 'Ctrl + D', action: 'Duplicate Selection Instantly', category: 'Editing & History' },
  { key: 'Delete / Backspace', action: 'Delete Selected Nodes', category: 'Editing & History' },
  { key: 'Ctrl + A', action: 'Select All Objects on Canvas', category: 'Editing & History' },
  { key: 'Ctrl + K', action: 'Open Board Brain AI Palette', category: 'Editing & History' },

  // Arrangement
  { key: 'Ctrl + G', action: 'Group Selected Nodes', category: 'Arrangement' },
  { key: 'Ctrl + Shift + G', action: 'Ungroup Nodes', category: 'Arrangement' },
  { key: 'Ctrl + ]', action: 'Bring Forward', category: 'Arrangement' },
  { key: 'Ctrl + [', action: 'Send Backward', category: 'Arrangement' },
  { key: 'Ctrl + Shift + ]', action: 'Bring to Absolute Front', category: 'Arrangement' },
  { key: 'Ctrl + Shift + [', action: 'Send to Absolute Back', category: 'Arrangement' },
  { key: 'Ctrl + L', action: 'Lock / Unlock Selection', category: 'Arrangement' }
];

export default function ShortcutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'Tools', 'Canvas Navigation', 'Editing & History', 'Arrangement'];

  const filtered = SHORTCUTS.filter(s => {
    const matchesCat = selectedCat === 'All' || s.category === selectedCat;
    const matchesSearch = s.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="settings" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">Keyboard Shortcuts</h1>
            <p className="text-xs text-[#71717A] mt-1">Navigate, draft, and manipulate whiteboard objects at supersonic speed.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcut or key..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCat === cat
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-white border border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] hover:border-[#CBD5E1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Shortcuts Table / Card List */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-[#F4F4F5]">
            {filtered.map((item, idx) => (
              <div 
                key={idx}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-[#FAFAF9] transition-colors"
              >
                <div>
                  <span className="text-xs font-semibold text-[#18181B] block">{item.action}</span>
                  <span className="text-[10px] text-[#A1A1AA]">{item.category}</span>
                </div>

                <kbd className="px-2.5 py-1 bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg font-mono text-xs font-bold text-[#18181B] shadow-2xs">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 p-6">
              <Keyboard className="w-8 h-8 text-[#A1A1AA] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#18181B]">No matching shortcut found</p>
              <p className="text-[11px] text-[#71717A] mt-0.5">Try searching for &quot;Zoom&quot;, &quot;Duplicate&quot;, or &quot;Undo&quot;.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
