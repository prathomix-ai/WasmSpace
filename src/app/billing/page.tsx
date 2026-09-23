'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HubNavigation from '@/components/HubNavigation';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import { 
  CreditCard, Check, Sparkles, Zap, Shield, 
  Download, ArrowRight, CheckCircle2, Clock, HelpCircle 
} from 'lucide-react';

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const invoices = [
    { id: 'INV-2026-001', date: 'Sep 01, 2026', amount: '$0.00', plan: 'Free Tier', status: 'Paid' },
    { id: 'INV-2026-002', date: 'Aug 01, 2026', amount: '$0.00', plan: 'Free Tier', status: 'Paid' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="settings" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="px-3 py-1 bg-[#635BFF]/10 text-[#635BFF] text-xs font-semibold rounded-full uppercase tracking-wider">
            Plans & Capacity
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18181B] mt-3">
            Predictable pricing for builders and teams
          </h1>
          <p className="text-sm text-[#71717A] mt-2 leading-relaxed">
            Free forever for personal ideation. Upgrade to Pro for high-throughput AI synthesis, 150 actions per 12 hours, and premium diagram tools.
          </p>

          {/* Billing Cycle Switch */}
          <div className="mt-6 inline-flex items-center p-1 bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <span>Annual billing</span>
              <span className="px-1.5 py-0.5 bg-[#635BFF]/10 text-[#635BFF] text-[10px] font-bold rounded">Save 18%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Free Plan */}
          <div className="bg-white border-2 border-[#E4E4E7] rounded-3xl p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">Starter</span>
                <span className="px-2.5 py-1 bg-[#F4F4F5] text-[#18181B] text-xs font-semibold rounded-lg">Current Plan</span>
              </div>

              <h2 className="text-2xl font-bold text-[#18181B]">Free</h2>
              <p className="text-xs text-[#71717A] mt-1 mb-6">Essential whiteboard tools for fast sketches and individual problem solving.</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-[#18181B]">$0</span>
                <span className="text-xs text-[#71717A]">/ month</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-[#F4F4F5] text-xs text-[#18181B]">
                {[
                  '15 AI actions per 12 hours (resets automatically)',
                  'Infinite canvas with pan, zoom, and dot grid',
                  'Basic shapes, flowchart symbols, and connectors',
                  'Sticky notes, freehand pen, and highlighter',
                  'Standard image upload (up to 25MB)',
                  'Up to 3 active whiteboards'
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled
              className="mt-8 w-full py-2.5 bg-[#F4F4F5] text-[#71717A] text-xs font-semibold rounded-xl cursor-default"
            >
              Current Active Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white border-2 border-[#635BFF] rounded-3xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#635BFF] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Recommended
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#635BFF]">Pro Builder</span>
                <span className="px-2.5 py-1 bg-[#635BFF]/10 text-[#635BFF] text-xs font-bold rounded-lg">PRO</span>
              </div>

              <h2 className="text-2xl font-bold text-[#18181B]">MasmSpace Pro</h2>
              <p className="text-xs text-[#71717A] mt-1 mb-6">Unleash the full potential of Board Brain AI and unlimited team whiteboards.</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-[#18181B]">
                  {billingCycle === 'yearly' ? '$4.08' : '$5.00'}
                </span>
                <span className="text-xs text-[#71717A]">
                  {billingCycle === 'yearly' ? '/ mo (billed $49/yr)' : '/ month'}
                </span>
              </div>

              <div className="space-y-3 pt-6 border-t border-[#F4F4F5] text-xs text-[#18181B]">
                {[
                  '150 AI actions per 12 hours (10x capacity)',
                  'Advanced AI diagram & flowchart generation',
                  'Unlimited whiteboards and projects',
                  'Advanced templates & wireframe design kits',
                  'High-res vector SVG & PDF export without watermark',
                  'Presentation recording & live audience viewport sync',
                  'Priority generation speed & 24/7 support'
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 font-medium">
                    <Check className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="mt-8 w-full py-2.5 bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Quota Status */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#18181B]">Current 12-Hour AI Quota</h3>
              <p className="text-xs text-[#71717A]">8 of 15 free AI actions consumed. Resets automatically in 7h 42m.</p>
            </div>
          </div>

          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 bg-white border border-[#E4E4E7] hover:border-[#635BFF] text-xs font-semibold text-[#18181B] rounded-xl transition-all shadow-2xs"
          >
            Expand to 150 Actions
          </button>
        </div>

        {/* Invoice Receipts */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#18181B] mb-4">Payment Receipts & Invoices</h3>
          <div className="divide-y divide-[#F4F4F5]">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#18181B] block">{inv.id}</span>
                  <span className="text-[#71717A] text-[11px]">{inv.date} • {inv.plan}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[#18181B]">{inv.amount}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-semibold">
                    {inv.status}
                  </span>
                  <button 
                    onClick={() => showToast(`Downloaded invoice ${inv.id}`)}
                    className="p-1.5 text-[#71717A] hover:text-[#18181B] rounded-lg hover:bg-[#F4F4F5]"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="MasmSpace Pro"
      />
    </div>
  );
}
