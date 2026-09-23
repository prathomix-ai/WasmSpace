'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HubNavigation from '@/components/HubNavigation';
import { 
  Search, Layout, FileText, MessageSquare, StickyNote, 
  Sparkles, ArrowUpRight, Clock, Tag, Filter, CheckCircle2 
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  type: 'board' | 'sticky' | 'text' | 'file' | 'comment' | 'template';
  location: string;
  updatedAt: string;
  url: string;
}

const ALL_RESULTS: SearchResult[] = [
  {
    id: 'res-1',
    title: 'Product Strategy & Architecture 2026',
    snippet: 'Core microservices topologies, API gateway routes, and regional failover policies.',
    type: 'board',
    location: 'Project: Q3 Architecture',
    updatedAt: '10 mins ago',
    url: '/canvas?board=b-1'
  },
  {
    id: 'res-2',
    title: 'PostgreSQL read replicas latency spike',
    snippet: 'Observed 120ms read lag on US-East replica cluster during batch indexing jobs.',
    type: 'sticky',
    location: 'Board: Product Strategy • Cluster Frame',
    updatedAt: '1 hour ago',
    url: '/canvas?board=b-1&focus=node-2'
  },
  {
    id: 'res-3',
    title: 'architecture-diagram-q3.png',
    snippet: '1.4 MB image asset embedded on 3 production canvas boards.',
    type: 'file',
    location: 'Files Asset Pool',
    updatedAt: '2 hours ago',
    url: '/files'
  },
  {
    id: 'res-4',
    title: 'Marcus Vance on "Cache Invalidation Policy"',
    snippet: 'Should we switch Redis cluster to LRU eviction or stick with explicit TTLs?',
    type: 'comment',
    location: 'Board: Microservices Map • Edge Caching',
    updatedAt: 'Yesterday',
    url: '/canvas?board=b-2&comment=c-4'
  },
  {
    id: 'res-5',
    title: 'RAG & Vector AI Topology',
    snippet: 'Engineering template with embedding models, vector search index, and guardrails pipeline.',
    type: 'template',
    location: 'Template Library • Engineering',
    updatedAt: 'Sep 18, 2026',
    url: '/templates'
  },
  {
    id: 'res-6',
    title: 'Design System Typography Scale',
    snippet: 'H1 24px/32px, Body 14px/20px, Caption 12px/16px using Inter and Geist fonts.',
    type: 'text',
    location: 'Board: MasmSpace Design System',
    updatedAt: 'Sep 16, 2026',
    url: '/canvas?board=b-3'
  }
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = ALL_RESULTS.filter(item => {
    const matchesQuery = query.trim() === '' || 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.snippet.toLowerCase().includes(query.toLowerCase()) ||
      item.location.toLowerCase().includes(query.toLowerCase());
    
    if (activeFilter === 'all') return matchesQuery;
    return matchesQuery && item.type === activeFilter;
  });

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'board': return <Layout className="w-4 h-4 text-[#635BFF]" />;
      case 'sticky': return <StickyNote className="w-4 h-4 text-amber-500" />;
      case 'file': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'template': return <Sparkles className="w-4 h-4 text-violet-500" />;
      default: return <FileText className="w-4 h-4 text-[#71717A]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="search" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {/* Main Search Input */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards, sticky notes, files, comments, or templates..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E4E4E7] rounded-2xl text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'board', label: 'Boards' },
            { id: 'sticky', label: 'Sticky Notes' },
            { id: 'text', label: 'Text Blocks' },
            { id: 'file', label: 'Files' },
            { id: 'comment', label: 'Comments' },
            { id: 'template', label: 'Templates' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === f.id
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-white border border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] hover:border-[#CBD5E1]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {filtered.map(res => (
            <Link
              key={res.id}
              href={res.url}
              className="group block bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-2xl p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(res.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#18181B] group-hover:text-[#635BFF] transition-colors flex items-center gap-2">
                      {res.title}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#71717A] capitalize">
                        {res.type}
                      </span>
                    </h3>
                    <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                      {res.snippet}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#A1A1AA] mt-2">
                      <span>{res.location}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {res.updatedAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 text-[#A1A1AA] group-hover:text-[#635BFF] rounded-lg group-hover:bg-[#635BFF]/5 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#E4E4E7] rounded-2xl p-8">
            <Search className="w-10 h-10 text-[#A1A1AA] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#18181B]">No matches found</h3>
            <p className="text-xs text-[#71717A] mt-1">Try searching with different keywords or clearing filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
