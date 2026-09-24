"use client";

import React, { useState } from "react";
import Link from "next/link";
import HubNavigation from "@/components/HubNavigation";
import {
  FolderGit2,
  Plus,
  Search,
  Folder,
  LayoutGrid,
  Clock,
  ArrowRight,
  MoreVertical,
  Trash2,
} from "lucide-react";

interface ProjectFolder {
  id: string;
  name: string;
  boardCount: number;
  updatedAt: string;
  description: string;
}

const INITIAL_PROJECTS: ProjectFolder[] = [
  {
    id: "p-1",
    name: "Core Cloud Platform",
    boardCount: 4,
    updatedAt: "1 hour ago",
    description: "Distributed infrastructure, ingress gateway, and security perimeter topologies.",
  },
  {
    id: "p-2",
    name: "Q3 Product Discovery",
    boardCount: 3,
    updatedAt: "Yesterday",
    description: "User journey mapping, feature stickies, and onboarding experiments.",
  },
  {
    id: "p-3",
    name: "Payment Gateway Integration",
    boardCount: 2,
    updatedAt: "3 days ago",
    description: "Checkout sequence flowcharts, webhook fallbacks, and ledger schema models.",
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectFolder[]>(INITIAL_PROJECTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    const name = prompt("Enter project folder name:", "New Engineering Project");
    if (name) {
      const newProj: ProjectFolder = {
        id: `p-${Date.now()}`,
        name,
        boardCount: 0,
        updatedAt: "Just now",
        description: "Architecture blueprints and collaborative boards.",
      };
      setProjects((prev) => [newProj, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F4F4F5] flex flex-col font-sans select-none">
      <HubNavigation currentTab="projects" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">
              Projects
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Organize related architecture topologies, sprint maps, and diagrams into workspaces.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-[#171719] border border-[#2A2A2F] placeholder-[#71717A] text-[#F4F4F5] focus:outline-none focus:border-[#7C6CFF]"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Project Folders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-xl bg-[#171719] border border-[#2A2A2F] hover:border-[#7C6CFF] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1C1C1F] border border-[#2A2A2F] flex items-center justify-center text-[#7C6CFF]">
                    <Folder className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-[#71717A]">
                    {proj.boardCount} boards
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#F4F4F5] group-hover:text-[#7C6CFF] transition-colors mb-1.5">
                  {proj.name}
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-2">
                  {proj.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#2A2A2F] flex items-center justify-between">
                <span className="text-[10px] text-[#71717A] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{proj.updatedAt}</span>
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#7C6CFF] hover:text-[#635BFF] transition-colors"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
