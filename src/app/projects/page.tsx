'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HubNavigation from '@/components/HubNavigation';
import { 
  Folder, Plus, Search, MoreHorizontal, Users, Calendar, 
  ArrowUpRight, Layout, Trash2, Edit3, Archive, Lock, Globe 
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  boardCount: number;
  memberCount: number;
  members: string[];
  updatedAt: string;
  isPrivate: boolean;
  color: string;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Q3 Enterprise Architecture',
    description: 'High-availability microservices transition, AWS multi-region topology and DB replication graphs.',
    boardCount: 8,
    memberCount: 6,
    members: ['Alex Rivera', 'Priya Patel', 'Sam Chen'],
    updatedAt: '12 mins ago',
    isPrivate: true,
    color: '#635BFF'
  },
  {
    id: 'proj-2',
    name: 'MasmSpace Design System 2.0',
    description: 'Component tokens, canvas primitives, contextual toolbars, and light typography specifications.',
    boardCount: 14,
    memberCount: 9,
    members: ['Elena Rostova', 'Marcus Vance'],
    updatedAt: '1 hour ago',
    isPrivate: false,
    color: '#10B981'
  },
  {
    id: 'proj-3',
    name: 'Growth & Funnel Roadmaps',
    description: 'Self-serve conversion metrics, onboarding user journey diagrams, and A/B test wireframes.',
    boardCount: 5,
    memberCount: 4,
    members: ['Chloe Dupont', 'Liam Scott'],
    updatedAt: 'Yesterday',
    isPrivate: false,
    color: '#F59E0B'
  },
  {
    id: 'proj-4',
    name: 'Board Brain AI Engine',
    description: 'LLM context piping, spatial clustering logic, and automatic diagram vectorization pipelines.',
    boardCount: 3,
    memberCount: 5,
    members: ['Alex Rivera', 'Devin Taylor'],
    updatedAt: '3 days ago',
    isPrivate: true,
    color: '#EC4899'
  }
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: newTitle,
      description: newDesc || 'No description provided.',
      boardCount: 1,
      memberCount: 1,
      members: ['You'],
      updatedAt: 'Just now',
      isPrivate: newIsPrivate,
      color: '#635BFF'
    };

    setProjects([newProj, ...projects]);
    setNewTitle('');
    setNewDesc('');
    setShowNewModal(false);
  };

  const handleDelete = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    setActiveMenuId(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="projects" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">Projects</h1>
            <p className="text-xs text-[#71717A] mt-1">Organize boards, assets, and collaborators into structured workspaces.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="group relative bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-2xl p-5 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: project.color }}
                    >
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#18181B] group-hover:text-[#635BFF] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] mt-0.5">
                        {project.isPrivate ? (
                          <span className="flex items-center gap-1 text-[#71717A]">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#71717A]">
                            <Globe className="w-3 h-3" /> Team workspace
                          </span>
                        )}
                        <span>•</span>
                        <span>{project.boardCount} {project.boardCount === 1 ? 'board' : 'boards'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                      className="p-1 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeMenuId === project.id && (
                      <div className="absolute right-0 top-7 w-40 bg-white border border-[#E4E4E7] rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95">
                        <Link
                          href={`/canvas?project=${project.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#18181B] hover:bg-[#F4F4F5]"
                        >
                          <Layout className="w-3.5 h-3.5 text-[#71717A]" /> Open Canvas
                        </Link>
                        <button
                          onClick={() => setActiveMenuId(null)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#18181B] hover:bg-[#F4F4F5] text-left"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#71717A]" /> Rename
                        </button>
                        <button
                          onClick={() => setActiveMenuId(null)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#18181B] hover:bg-[#F4F4F5] text-left"
                        >
                          <Archive className="w-3.5 h-3.5 text-[#71717A]" /> Archive
                        </button>
                        <div className="h-px bg-[#E4E4E7] my-1" />
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#71717A] leading-relaxed line-clamp-2 mb-4">
                  {project.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between pt-4 border-t border-[#F4F4F5] text-[11px] text-[#71717A]">
                  <div className="flex items-center -space-x-1.5">
                    {project.members.map((m, idx) => (
                      <div 
                        key={idx}
                        className="w-6 h-6 rounded-full bg-[#E4E4E7] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#18181B]"
                        title={m}
                      >
                        {m.charAt(0)}
                      </div>
                    ))}
                    {project.memberCount > project.members.length && (
                      <div className="w-6 h-6 rounded-full bg-[#F4F4F5] border-2 border-white flex items-center justify-center text-[9px] font-medium text-[#71717A]">
                        +{project.memberCount - project.members.length}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[#71717A]">
                    <Calendar className="w-3 h-3" />
                    <span>{project.updatedAt}</span>
                  </div>
                </div>

                <Link
                  href={`/dashboard?project=${project.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-xs font-medium rounded-xl transition-all"
                >
                  View Boards <ArrowUpRight className="w-3.5 h-3.5 text-[#71717A]" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#E4E4E7] rounded-2xl p-8">
            <Folder className="w-10 h-10 text-[#A1A1AA] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#18181B]">No projects found</h3>
            <p className="text-xs text-[#71717A] mt-1">Try another search or create a new project workspace.</p>
          </div>
        )}
      </main>

        {/* Create Project Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
              <h2 className="text-base font-bold text-[#18181B] mb-1">Create New Project</h2>
              <p className="text-xs text-[#71717A] mb-5">Group related whiteboards, roadmaps, and sprint artifacts.</p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1.5">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q4 Mobile App Redesign"
                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1.5">Description (optional)</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief objective of this workspace..."
                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-[#18181B] block">Private Project</span>
                    <span className="text-[11px] text-[#71717A]">Only invited team members will have access.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newIsPrivate}
                    onChange={(e) => setNewIsPrivate(e.target.checked)}
                    className="w-4 h-4 accent-[#635BFF] rounded"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[#71717A] hover:bg-[#F4F4F5] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5248E5] rounded-xl shadow-sm transition-all"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
