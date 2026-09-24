"use client";

import React, { useState } from "react";
import Link from "next/link";
import HubNavigation from "@/components/HubNavigation";
import {
  Search,
  LayoutGrid,
  StickyNote,
  FileCode,
  Folder,
  ArrowRight,
  Sparkles,
  Command,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  category: "boards" | "sticky notes" | "objects" | "files" | "projects";
  location: string;
  updatedAt: string;
  href: string;
}

const SEARCH_DATABASE: SearchResult[] = [
  {
    id: "r-1",
    title: "System Architecture & Ingress Gateway",
    category: "boards",
    location: "Core Cloud Platform",
    updatedAt: "12 mins ago",
    href: "/canvas",
  },
  {
    id: "r-2",
    title: "Rate limiter enforced at edge CDN: 120 req/min per IP",
    category: "sticky notes",
    location: "System Architecture Topology",
    updatedAt: "1 hour ago",
    href: "/canvas",
  },
  {
    id: "r-3",
    title: "system-topology-blueprint.json",
    category: "files",
    location: "Files / Specs",
    updatedAt: "2 hours ago",
    href: "/files",
  },
  {
    id: "r-4",
    title: "Payment Gateway Integration",
    category: "projects",
    location: "Root / Projects",
    updatedAt: "3 days ago",
    href: "/projects",
  },
  {
    id: "r-5",
    title: "P99 response latency < 25ms end-to-end",
    category: "sticky notes",
    location: "Microservices Event Stream Bus",
    updatedAt: "Yesterday",
    href: "/canvas",
  },
  {
    id: "r-6",
    title: "Microservices & Ingress Gateway Blueprint",
    category: "boards",
    location: "Templates",
    updatedAt: "Just now",
    href: "/canvas?template=microservices",
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", "boards", "sticky notes", "files", "projects"];

  const filtered = SEARCH_DATABASE.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.location.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F4F4F5] flex flex-col font-sans select-none">
      <HubNavigation currentTab="search" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171719] border border-[#2A2A2F] text-[11px] font-mono text-[#7C6CFF] mb-3">
            <Command className="w-3 h-3" />
            <span>Search Workspace</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F4F4F5]">
            Unified Workspace Search
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Instantly locate boards, sticky notes, architectural nodes, files, and project folders.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all boards, notes, and components..."
            autoFocus
            className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-[#171719] border border-[#2A2A2F] text-[#F4F4F5] placeholder-[#71717A] outline-none focus:border-[#7C6CFF] shadow-lg"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-medium"
                  : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#171719]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-[#2A2A2F] rounded-xl bg-[#171719] text-xs text-[#71717A]">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((res) => (
              <Link
                key={res.id}
                href={res.href}
                className="flex items-center justify-between p-3.5 rounded-lg bg-[#171719] border border-[#2A2A2F] hover:border-[#7C6CFF] transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-[#1C1C1F] border border-[#2A2A2F] flex items-center justify-center text-[#7C6CFF] shrink-0">
                    {res.category === "boards" ? (
                      <LayoutGrid className="w-4 h-4" />
                    ) : res.category === "sticky notes" ? (
                      <StickyNote className="w-4 h-4 text-[#FBBF24]" />
                    ) : res.category === "files" ? (
                      <FileCode className="w-4 h-4 text-[#3B82F6]" />
                    ) : (
                      <Folder className="w-4 h-4 text-[#4ADE80]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#F4F4F5] group-hover:text-[#7C6CFF] truncate">
                      {res.title}
                    </div>
                    <div className="text-[11px] text-[#71717A] flex items-center gap-2 mt-0.5 font-mono">
                      <span className="capitalize">{res.category}</span>
                      <span>·</span>
                      <span>{res.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[10px] font-mono text-[#71717A] hidden sm:inline">
                    {res.updatedAt}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#7C6CFF] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
