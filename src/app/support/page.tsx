'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HubNavigation from '@/components/HubNavigation';
import { 
  HelpCircle, BookOpen, MessageSquare, Mail, 
  Search, ArrowRight, ExternalLink, CheckCircle2, ChevronDown 
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How does the 12-hour AI limit work?',
    a: 'On the Free tier, you receive 15 AI actions that automatically reset every 12 hours from your first usage. On MasmSpace Pro, you receive 150 AI actions every 12 hours with priority response latency and complex diagram synthesis.'
  },
  {
    q: 'Can I independently resize and edit line endpoints?',
    a: 'Yes! MasmSpace features independent start and end control points on lines and connectors. You can freely drag the head, tail, or midpoint curvature handles without altering the overall bounding box.'
  },
  {
    q: 'How do I invite teammates to collaborate in real-time?',
    a: 'Click the "Share" button in the top right floating bar of any whiteboard. You can generate a private invite link, invite collaborators via email, or set permissions to "Can View", "Can Comment", or "Can Edit".'
  },
  {
    q: 'What file formats can I import onto the canvas?',
    a: 'MasmSpace supports PNG, JPG, WEBP, SVG, PDF, CSV, and DOCX files up to 100MB each. Drag any file from your computer directly onto the canvas to insert it as an interactive element.'
  },
  {
    q: 'Is my data encrypted and private?',
    a: 'All canvas state, strokes, and uploaded assets are encrypted in transit via TLS 1.3 and at rest with AES-256 encryption. We never train public foundation models on your private whiteboard diagrams.'
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMsg.trim()) return;
    showToast('Your message has been sent to MasmSpace support.');
    setContactSubject('');
    setContactMsg('');
  };

  const filteredFaqs = FAQS.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="settings" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="px-3 py-1 bg-[#635BFF]/10 text-[#635BFF] text-xs font-semibold rounded-full uppercase tracking-wider">
            Help & Documentation
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18181B] mt-3">
            How can we help you?
          </h1>
          <p className="text-xs text-[#71717A] mt-2">
            Search our knowledge base, frequently asked questions, or get in touch with our engineering team.
          </p>

          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles, guides, or troubleshooting..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E4E4E7] rounded-2xl text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] shadow-xs"
            />
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link
            href="/shortcuts"
            className="p-5 bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-2xl shadow-2xs hover:shadow-sm transition-all"
          >
            <BookOpen className="w-5 h-5 text-[#635BFF] mb-2" />
            <h3 className="text-xs font-bold text-[#18181B]">Shortcuts Guide</h3>
            <p className="text-[11px] text-[#71717A] mt-1">Master keyboard workflows for high-speed whiteboard diagramming.</p>
          </Link>

          <Link
            href="/templates"
            className="p-5 bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-2xl shadow-2xs hover:shadow-sm transition-all"
          >
            <HelpCircle className="w-5 h-5 text-[#10B981] mb-2" />
            <h3 className="text-xs font-bold text-[#18181B]">Templates Library</h3>
            <p className="text-[11px] text-[#71717A] mt-1">Browse pre-assembled flowcharts, roadmaps, and brainstorming boards.</p>
          </Link>

          <Link
            href="/billing"
            className="p-5 bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-2xl shadow-2xs hover:shadow-sm transition-all"
          >
            <MessageSquare className="w-5 h-5 text-[#F59E0B] mb-2" />
            <h3 className="text-xs font-bold text-[#18181B]">Billing & Quotas</h3>
            <p className="text-[11px] text-[#71717A] mt-1">Understand the 12-hour AI limit and Pro subscription perks.</p>
          </Link>
        </div>

        {/* FAQs */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 mb-10 shadow-xs">
          <h2 className="text-sm font-bold text-[#18181B] mb-4">Frequently Asked Questions</h2>
          <div className="divide-y divide-[#F4F4F5]">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="py-3">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#18181B] hover:text-[#635BFF] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#71717A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-[#71717A] mt-2 leading-relaxed animate-in fade-in duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#18181B] mb-1">Contact Engineering Support</h2>
          <p className="text-xs text-[#71717A] mb-4">Have an issue or custom feature request? Send our team a note directly.</p>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">Subject</label>
              <input
                type="text"
                required
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="e.g. Question regarding connector endpoint snapping"
                className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Describe your issue or feedback in detail..."
                className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] focus:border-[#635BFF] focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
