"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HubNavigation from "@/components/HubNavigation";
import {
  Search,
  Sparkles,
  ArrowRight,
  GitBranch,
  Kanban,
  Compass,
  Layers,
  Cpu,
  Workflow,
  CheckCircle2,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nodesCount: number;
  icon: any;
}

const TEMPLATES: Template[] = [
  {
    id: "microservices",
    name: "Microservices & Ingress Gateway",
    description: "API gateway, auth cluster, message bus, distributed workers, and cached read-replicas.",
    category: "Architecture",
    nodesCount: 18,
    icon: Cpu,
  },
  {
    id: "kanban",
    name: "Sprint Planning & Roadmaps",
    description: "Backlog stickies, active sprint swimlanes, review checkpoints, and deployment trackers.",
    category: "Agile Planning",
    nodesCount: 14,
    icon: Kanban,
  },
  {
    id: "cloud-edge",
    name: "Cloud Edge & CDN Topology",
    description: "Edge serverless workers, global CDN caching, origin cluster, and multi-region failovers.",
    category: "Infrastructure",
    nodesCount: 16,
    icon: Compass,
  },
  {
    id: "decision-flow",
    name: "System Decision Flowchart",
    description: "Structured flowchart with decision diamonds, process blocks, and branch outcomes.",
    category: "Flowcharts",
    nodesCount: 12,
    icon: Workflow,
  },
  {
    id: "mindmap",
    name: "Product Idea Mind Map",
    description: "Radial mind map with divergent branches, concept nodes, and connected research stickies.",
    category: "Ideation",
    nodesCount: 20,
    icon: GitBranch,
  },
  {
    id: "layers",
    name: "Three-Tier Web Application",
    description: "Client presentation, business API application layer, and relational database tier.",
    category: "Architecture",
    nodesCount: 10,
    icon: Layers,
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "Architecture", "Agile Planning", "Infrastructure", "Flowcharts", "Ideation"];

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (tmplId: string) => {
    router.push(`/canvas?template=${tmplId}`);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F4F4F5] flex flex-col font-sans select-none">
      <HubNavigation currentTab="templates" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">
              Templates
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Production-ready blueprints for cloud topologies, system flows, and agile planning.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-[#171719] border border-[#2A2A2F] placeholder-[#71717A] text-[#F4F4F5] focus:outline-none focus:border-[#7C6CFF]"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 border-b border-[#2A2A2F] pb-3 mb-6 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer capitalize ${
                selectedCategory === cat
                  ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-medium"
                  : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C1F]"
              }`}
            >
              {cat === "all" ? "All Blueprints" : cat}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                className="p-5 rounded-xl bg-[#171719] border border-[#2A2A2F] hover:border-[#7C6CFF] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1C1C1F] border border-[#2A2A2F] flex items-center justify-center text-[#7C6CFF]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-[#71717A] px-2 py-0.5 rounded bg-[#111113] border border-[#2A2A2F]">
                      {t.nodesCount} nodes
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F4F4F5] group-hover:text-[#7C6CFF] transition-colors mb-1.5">
                    {t.name}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#2A2A2F] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#71717A]">{t.category}</span>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(t.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C6CFF] hover:text-[#635BFF] transition-colors cursor-pointer"
                  >
                    <span>Use template</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
