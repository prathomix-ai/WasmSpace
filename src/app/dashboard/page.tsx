"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Clock,
  Star,
  Users,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  LayoutGrid,
} from "lucide-react";
import HubNavigation from "@/components/HubNavigation";

interface BoardItem {
  id: string;
  title: string;
  lastEdited: string;
  owner: string;
  isFavorite: boolean;
  category: "recent" | "my" | "shared";
  collaborators: string[];
  blockCount: number;
}

const INITIAL_BOARDS: BoardItem[] = [
  {
    id: "board-1",
    title: "System Architecture & Ingress Gateway",
    lastEdited: "12 mins ago",
    owner: "Alex Rivera",
    isFavorite: true,
    category: "recent",
    collaborators: ["Sarah C.", "Michael K."],
    blockCount: 24,
  },
  {
    id: "board-2",
    title: "Cloud Edge & Vector Ingress Topology",
    lastEdited: "2 hours ago",
    owner: "Alex Rivera",
    isFavorite: true,
    category: "recent",
    collaborators: ["DevOps Team"],
    blockCount: 42,
  },
  {
    id: "board-3",
    title: "User Onboarding & Funnel Architecture",
    lastEdited: "Yesterday",
    owner: "Sarah Chen",
    isFavorite: false,
    category: "shared",
    collaborators: ["Alex R.", "Growth Squad"],
    blockCount: 18,
  },
  {
    id: "board-4",
    title: "Sprint 48 Architecture Review",
    lastEdited: "3 days ago",
    owner: "Alex Rivera",
    isFavorite: false,
    category: "my",
    collaborators: [],
    blockCount: 15,
  },
  {
    id: "board-5",
    title: "Microservices Event Stream Bus",
    lastEdited: "Last week",
    owner: "Alex Rivera",
    isFavorite: false,
    category: "my",
    collaborators: ["Alex R.", "Platform Team"],
    blockCount: 31,
  },
];

export default function DashboardPage() {
  const [boards, setBoards] = useState<BoardItem[]>(INITIAL_BOARDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "recent" | "my" | "shared" | "favorites">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))
    );
  };

  const deleteBoard = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this board?")) {
      setBoards((prev) => prev.filter((b) => b.id !== id));
      setOpenMenuId(null);
    }
  };

  const duplicateBoard = (board: BoardItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const copy: BoardItem = {
      ...board,
      id: `board-${Date.now()}`,
      title: `${board.title} (Copy)`,
      lastEdited: "Just now",
    };
    setBoards((prev) => [copy, ...prev]);
    setOpenMenuId(null);
  };

  const filteredBoards = boards.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "favorites") return matchesSearch && b.isFavorite;
    if (activeTab === "recent") return matchesSearch && b.category === "recent";
    if (activeTab === "my") return matchesSearch && b.category === "my";
    if (activeTab === "shared") return matchesSearch && b.category === "shared";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F4F4F5] flex flex-col font-sans select-none">
      <HubNavigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">
              Boards
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Your visual spaces for system thinking, diagramming, and sprint reviews.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-[#171719] border border-[#2A2A2F] placeholder-[#71717A] text-[#F4F4F5] focus:outline-none focus:border-[#7C6CFF]"
              />
            </div>

            {/* Create Board Button */}
            <Link
              href="/canvas"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Board</span>
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 border-b border-[#2A2A2F] pb-3 mb-6 overflow-x-auto text-xs font-medium">
          {[
            { id: "all", label: "All Boards", count: boards.length },
            { id: "recent", label: "Recent", count: boards.filter((b) => b.category === "recent").length },
            { id: "my", label: "My Boards", count: boards.filter((b) => b.category === "my").length },
            { id: "shared", label: "Shared with me", count: boards.filter((b) => b.category === "shared").length },
            { id: "favorites", label: "Favorites", count: boards.filter((b) => b.isFavorite).length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-semibold"
                  : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C1F]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1C1C1F] border border-[#2A2A2F] font-mono text-[#A1A1AA]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Board Cards Grid */}
        {filteredBoards.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#2A2A2F] rounded-xl bg-[#111113]">
            <LayoutGrid className="w-10 h-10 text-[#71717A] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#F4F4F5]">No boards found</h3>
            <p className="text-xs text-[#A1A1AA] mt-1 mb-4">
              {searchQuery ? "Try a different search query." : "Create your first board to start thinking visually."}
            </p>
            <Link
              href="/canvas"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#7C6CFF] text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Board</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBoards.map((b) => (
              <div
                key={b.id}
                className="group relative rounded-xl bg-[#171719] border border-[#2A2A2F] hover:border-[#7C6CFF] transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Star and Context Menu */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href="/canvas"
                      className="text-sm font-semibold text-[#F4F4F5] hover:text-[#7C6CFF] transition-colors line-clamp-1"
                    >
                      {b.title}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(b.id, e)}
                        className={`p-1 rounded transition-colors ${
                          b.isFavorite ? "text-[#FBBF24]" : "text-[#71717A] hover:text-[#F4F4F5]"
                        }`}
                        title={b.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === b.id ? null : b.id);
                          }}
                          className="p-1 rounded text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === b.id && (
                          <div className="absolute right-0 mt-1 w-36 rounded-md bg-[#1C1C1F] border border-[#2A2A2F] shadow-xl p-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={(e) => duplicateBoard(b, e)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#242428] text-left text-[#F4F4F5]"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => deleteBoard(b.id, e)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F87171]/10 text-left text-[#F87171]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail / Preview placeholder */}
                  <Link
                    href="/canvas"
                    className="block h-28 w-full rounded-lg bg-[#0D0D0F] border border-[#2A2A2F] mb-3 relative overflow-hidden group-hover:border-[#7C6CFF]/40 transition-colors"
                  >
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage: "radial-gradient(#18181B 1.2px, transparent 1.2px)",
                        backgroundSize: "16px 16px",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#71717A]">
                      {b.blockCount} blocks · Topology
                    </div>
                  </Link>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2F] text-[11px] text-[#71717A]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{b.lastEdited}</span>
                  </div>
                  <span className="font-mono">{b.owner}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
