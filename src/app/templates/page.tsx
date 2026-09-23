'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HubNavigation from '@/components/HubNavigation';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import { 
  Search, Sparkles, Layout, ArrowRight, CheckCircle2, 
  GitBranch, Kanban, Users, Target, Compass, Layers, 
  Share2, Shield, Cpu, BookOpen, Briefcase
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  isPro?: boolean;
  nodesCount: number;
  previewColor: string;
  icon: any;
}

const TEMPLATES: Template[] = [
  {
    id: 'tmpl-brainstorm',
    name: 'Collaborative Brainstorming',
    description: 'Central focus node with divergent sticky note clusters, voting dots, and synthesis quadrants.',
    category: 'Brainstorming',
    isPro: false,
    nodesCount: 16,
    previewColor: '#FEF08A',
    icon: Sparkles
  },
  {
    id: 'tmpl-mindmap',
    name: 'Radial Mind Map',
    description: 'Hierarchical tree structure with curved smart connectors and collapsible concept nodes.',
    category: 'Mind Map',
    isPro: false,
    nodesCount: 22,
    previewColor: '#E0E7FF',
    icon: GitBranch
  },
  {
    id: 'tmpl-kanban',
    name: 'Agile Sprint Board',
    description: 'Backlog, In Progress, Review, and Done columns with sticky task cards and assignee tags.',
    category: 'Project Planning',
    isPro: false,
    nodesCount: 18,
    previewColor: '#DCFCE7',
    icon: Kanban
  },
  {
    id: 'tmpl-flowchart',
    name: 'Microservice Request Lifecycle',
    description: 'Standardized flowchart with decision diamonds, API gateways, database clusters, and error fallbacks.',
    category: 'Engineering',
    isPro: false,
    nodesCount: 24,
    previewColor: '#E2E8F0',
    icon: Cpu
  },
  {
    id: 'tmpl-swot',
    name: 'SWOT Strategic Matrix',
    description: 'Four quadrant analysis for Strengths, Weaknesses, Opportunities, and Threats with weighted prioritization.',
    category: 'Business',
    isPro: false,
    nodesCount: 12,
    previewColor: '#FEE2E2',
    icon: Target
  },
  {
    id: 'tmpl-journey',
    name: 'User Experience Journey Map',
    description: 'Persona stages, customer thoughts, emotional curves, pain points, and opportunity highlights.',
    category: 'User Journey',
    isPro: true,
    nodesCount: 30,
    previewColor: '#F3E8FF',
    icon: Compass
  },
  {
    id: 'tmpl-wireframe',
    name: 'SaaS Dashboard Wireframe Kit',
    description: 'Pre-assembled wireframe blocks: navigation sidebar, stat widgets, chart containers, and tables.',
    category: 'Wireframe',
    isPro: true,
    nodesCount: 28,
    previewColor: '#E2E8F0',
    icon: Layers
  },
  {
    id: 'tmpl-roadmap',
    name: 'Product Roadmap 2026',
    description: 'Quarterly timeline frames (Q1-Q4) with milestone diamonds, track lanes, and dependency links.',
    category: 'Product Roadmap',
    isPro: true,
    nodesCount: 20,
    previewColor: '#FFEDD5',
    icon: Layout
  },
  {
    id: 'tmpl-retro',
    name: 'Sprint Retrospective',
    description: 'What went well, what to improve, action items, and kudos board with anonymous voting stickers.',
    category: 'Meeting',
    isPro: false,
    nodesCount: 15,
    previewColor: '#CFFAFE',
    icon: Users
  },
  {
    id: 'tmpl-ai-system',
    name: 'RAG & Vector AI Topology',
    description: 'Embedding models, vector database indexes, context retrieval reranker, and guardrails pipeline.',
    category: 'Engineering',
    isPro: true,
    nodesCount: 25,
    previewColor: '#E0E7FF',
    icon: Cpu
  }
];

const CATEGORIES = [
  'All',
  'Brainstorming',
  'Mind Map',
  'Project Planning',
  'Engineering',
  'Business',
  'User Journey',
  'Wireframe',
  'Product Roadmap',
  'Meeting'
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProModal, setShowProModal] = useState(false);
  const [activeProFeature, setActiveProFeature] = useState('Advanced Templates');

  const filtered = TEMPLATES.filter(t => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: Template) => {
    if (template.isPro) {
      setActiveProFeature(template.name);
      setShowProModal(true);
    } else {
      window.location.href = `/canvas?template=${template.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="templates" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">Template Library</h1>
            <p className="text-xs text-[#71717A] mt-1">Kickstart your whiteboard with battle-tested frameworks, wireframes, and architectural schematics.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-white border border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] hover:border-[#CBD5E1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(tmpl => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                className="group bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Schematic Mock Graphic */}
                  <div 
                    className="h-40 p-5 flex flex-col justify-between relative border-b border-[#F4F4F5]"
                    style={{ backgroundColor: `${tmpl.previewColor}33` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-[#18181B]">
                        <Icon className="w-4 h-4 text-[#635BFF]" />
                      </div>

                      {tmpl.isPro ? (
                        <span className="px-2 py-0.5 bg-[#635BFF] text-white text-[10px] font-bold rounded-md uppercase tracking-wider shadow-xs">
                          PRO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white/80 border border-[#E4E4E7] text-[#71717A] text-[10px] font-medium rounded-md">
                          Free
                        </span>
                      )}
                    </div>

                    {/* Subtle diagram skeleton */}
                    <div className="space-y-1.5 opacity-60">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-white rounded shadow-2xs" />
                        <div className="h-0.5 w-6 bg-[#A1A1AA]" />
                        <div className="h-4 w-20 bg-white rounded shadow-2xs" />
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <div className="h-0.5 w-4 bg-[#A1A1AA]" />
                        <div className="h-4 w-24 bg-white rounded shadow-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#71717A] mb-1">
                      <span>{tmpl.category}</span>
                      <span>•</span>
                      <span>{tmpl.nodesCount} elements</span>
                    </div>

                    <h3 className="text-sm font-bold text-[#18181B] group-hover:text-[#635BFF] transition-colors mb-2">
                      {tmpl.name}
                    </h3>

                    <p className="text-xs text-[#71717A] leading-relaxed line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleUseTemplate(tmpl)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#F4F4F5] group-hover:bg-[#635BFF] text-[#18181B] group-hover:text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#E4E4E7] rounded-2xl p-8">
            <Layout className="w-10 h-10 text-[#A1A1AA] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#18181B]">No templates found</h3>
            <p className="text-xs text-[#71717A] mt-1">Try another search term or browse different categories.</p>
          </div>
        )}
      </main>

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureName={activeProFeature}
      />
    </div>
  );
}
