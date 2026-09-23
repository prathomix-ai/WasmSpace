"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Clock,
  Star,
  Users,
  FolderPlus,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  FolderKanban,
  Sparkles,
  ArrowRight,
  Filter,
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
    title: "Product Strategy & Architecture 2026",
    lastEdited: "12 mins ago",
    owner: "Alex Rivera",
    isFavorite: true,
    category: "recent",
    collaborators: ["Sarah C.", "Michael K."],
    blockCount: 24,
  },
  {
    id: "board-2",
    title: "Cloud Infrastructure & Vector Ingress",
    lastEdited: "2 hours ago",
    owner: "Alex Rivera",
    isFavorite: true,
    category: "recent",
    collaborators: ["DevOps Team"],
    blockCount: 42,
  },
  {
    id: "board-3",
    title: "User Onboarding & Activation Funnel",
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
    title: "Microservices Event Topology",
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
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans">
      <HubNavigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">
              Boards
            </h1>
            <p className="text-xs text-[#71717A] mt-1">
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
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#E4E4E7] placeholder-[#71717A] text-[#18181B] focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
              />
            </div>

            {/* Create Board Button */}
            <Link
              href="/canvas"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold shadow-xs transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Board</span>
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 border-b border-[#E4E4E7] pb-3 mb-6 overflow-x-auto text-xs font-medium">
          {[
            { id: "all", label: "All Boards", count: boards.length },
            { id: "recent", label: "Recent Boards", count: boards.filter((b) => b.category === "recent").length },
            { id: "my", label: "My Boards", count: boards.filter((b) => b.category === "my").length },
            { id: "shared", label: "Shared with me", count: boards.filter((b) => b.category === "shared").length },
            { id: "favorites", label: "Favorites", count: boards.filter((b) => b.isFavorite).length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                  : "text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/70 font-mono text-[#52525B]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Board Cards Grid */}
        {filteredBoards.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-[#E4E4E7] bg-white p-8">
            <FolderKanban className="w-8 h-8 mx-auto text-[#71717A] mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-[#18181B] mb-1">
              No boards found
            </h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto mb-4">
              {searchQuery
                ? `No boards matched "${searchQuery}". Try a different keyword.`
                : "Get started by creating your first infinite whiteboard."}
            </p>
            <Link
              href="/canvas"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#635BFF] text-white text-xs font-semibold hover:bg-[#5248E5] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Board</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBoards.map((board) => (
              <div
                key={board.id}
                className="group relative rounded-2xl bg-white border border-[#E4E4E7] hover:border-[#635BFF]/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all flex flex-col overflow-hidden"
              >
                {/* Visual Thumbnail Area */}
                <Link
                  href="/canvas"
                  className="h-36 bg-[#FAFAF9] border-b border-[#E4E4E7] p-3 flex flex-col justify-between relative overflow-hidden group-hover:bg-[#F4F4F5] transition-colors"
                >
                  {/* Subtle dot pattern */}
                  <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(24, 24, 27, 0.12) 1px, transparent 0)",
                      backgroundSize: "16px 16px",
                    }}
                  />

                  {/* Thumbnail Mock Blocks */}
                  <div className="relative z-10 flex items-center justify-center h-full">
                    <div className="w-24 h-16 rounded-lg bg-white border border-[#E4E4E7] shadow-2xs p-1.5 flex flex-col justify-between">
                      <div className="w-10 h-1.5 rounded-full bg-[#635BFF]/30" />
                      <div className="space-y-1">
                        <div className="w-16 h-1 rounded-full bg-zinc-200" />
                        <div className="w-12 h-1 rounded-full bg-zinc-200" />
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Favorite Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(board.id, e)}
                    className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg bg-white/90 hover:bg-white text-zinc-400 hover:text-amber-500 shadow-2xs transition-colors cursor-pointer"
                    title={board.isFavorite ? "Remove favorite" : "Add to favorites"}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        board.isFavorite ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </button>
                </Link>

                {/* Card Content & Metadata */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link
                        href="/canvas"
                        className="text-xs font-semibold text-[#18181B] group-hover:text-[#635BFF] transition-colors line-clamp-1 leading-snug"
                        title={board.title}
                      >
                        {board.title}
                      </Link>

                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === board.id ? null : board.id)
                          }
                          className="p-1 rounded-md text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Card Context Menu */}
                        {openMenuId === board.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-[#E4E4E7] rounded-xl shadow-lg p-1 z-30 text-xs">
                            <Link
                              href="/canvas"
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                              <span>Open Board</span>
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => duplicateBoard(board, e)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3 h-3 text-zinc-400" />
                              <span>Duplicate</span>
                            </button>
                            <div className="h-px bg-zinc-100 my-1" />
                            <button
                              type="button"
                              onClick={(e) => deleteBoard(board.id, e)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#71717A] mb-3">
                      <span>Edited {board.lastEdited}</span>
                      <span>·</span>
                      <span>{board.blockCount} blocks</span>
                    </div>
                  </div>

                  {/* Collaborator Avatars */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F4F4F5]">
                    <span className="text-[10px] text-[#71717A] font-medium truncate max-w-[120px]">
                      {board.owner}
                    </span>

                    {board.collaborators.length > 0 && (
                      <div className="flex items-center -space-x-1.5">
                        {board.collaborators.slice(0, 2).map((c, i) => (
                          <div
                            key={i}
                            title={c}
                            className="w-5 h-5 rounded-full bg-[#635BFF] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white"
                          >
                            {c.charAt(0)}
                          </div>
                        ))}
                        {board.collaborators.length > 2 && (
                          <div className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 text-[8px] font-bold flex items-center justify-center ring-2 ring-white font-mono">
                            +{board.collaborators.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
