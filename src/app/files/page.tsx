'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HubNavigation from '@/components/HubNavigation';
import { 
  FileText, Image as ImageIcon, FileSpreadsheet, FileCode, Upload, 
  Search, MoreHorizontal, Download, Trash2, ArrowUpRight, CheckCircle2, 
  ExternalLink, Filter, FolderPlus, Clock, HardDrive
} from 'lucide-react';

interface FileAsset {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'csv' | 'svg';
  size: string;
  uploadedAt: string;
  boardCount: number;
  previewUrl?: string;
}

const INITIAL_FILES: FileAsset[] = [
  {
    id: 'f-1',
    name: 'architecture-diagram-q3.png',
    type: 'image',
    size: '1.4 MB',
    uploadedAt: '2 hours ago',
    boardCount: 3,
    previewUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'f-2',
    name: 'system-specifications-v2.pdf',
    type: 'pdf',
    size: '4.8 MB',
    uploadedAt: 'Yesterday',
    boardCount: 1
  },
  {
    id: 'f-3',
    name: 'user_onboarding_metrics.csv',
    type: 'csv',
    size: '840 KB',
    uploadedAt: '3 days ago',
    boardCount: 2
  },
  {
    id: 'f-4',
    name: 'brand_icons_masmspace.svg',
    type: 'svg',
    size: '220 KB',
    uploadedAt: 'Sep 18, 2026',
    boardCount: 5
  },
  {
    id: 'f-5',
    name: 'cloud-infrastructure-costing.xlsx',
    type: 'document',
    size: '2.1 MB',
    uploadedAt: 'Sep 14, 2026',
    boardCount: 1
  },
  {
    id: 'f-6',
    name: 'mobile-app-mockup.png',
    type: 'image',
    size: '3.2 MB',
    uploadedAt: 'Sep 10, 2026',
    boardCount: 4,
    previewUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&auto=format&fit=crop&q=80'
  }
];

export default function FilesPage() {
  const [files, setFiles] = useState<FileAsset[]>(INITIAL_FILES);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'image') return matchesSearch && (f.type === 'image' || f.type === 'svg');
    if (filterType === 'pdf') return matchesSearch && f.type === 'pdf';
    if (filterType === 'document') return matchesSearch && (f.type === 'document' || f.type === 'csv');
    return matchesSearch;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    showToast('File removed successfully');
  };

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    const newFile: FileAsset = {
      id: `f-${Date.now()}`,
      name: uploaded.name,
      type: uploaded.name.endsWith('.png') || uploaded.name.endsWith('.jpg') ? 'image' : 'document',
      size: `${(uploaded.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: 'Just now',
      boardCount: 0
    };

    setFiles([newFile, ...files]);
    showToast(`Uploaded "${uploaded.name}"`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] flex flex-col font-sans selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      <HubNavigation currentTab="files" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#18181B]">Files & Assets</h1>
            <p className="text-xs text-[#71717A] mt-1">Manage images, documents, PDFs, and exported canvas assets across all your boards.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Files
              <input type="file" onChange={handleSimulatedUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Upload Dropzone Banner */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            showToast('Files received and uploaded');
          }}
          className={`mb-8 border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            isDragging 
              ? 'border-[#635BFF] bg-[#635BFF]/5' 
              : 'border-[#E4E4E7] bg-white hover:border-[#CBD5E1]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto mb-2 text-[#71717A]">
            <Upload className="w-5 h-5 text-[#635BFF]" />
          </div>
          <p className="text-xs font-semibold text-[#18181B]">Drag and drop files here, or browse from device</p>
          <p className="text-[11px] text-[#71717A] mt-0.5">Supports PNG, JPG, SVG, PDF, DOCX, CSV up to 100MB</p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E4E4E7] rounded-xl shadow-xs">
            {[
              { id: 'all', label: 'All Assets' },
              { id: 'image', label: 'Images & SVGs' },
              { id: 'pdf', label: 'PDF Documents' },
              { id: 'document', label: 'Sheets & CSV' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === tab.id
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file name..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#E4E4E7] rounded-xl text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="group bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col justify-between"
            >
              {/* Preview Container */}
              <div className="h-36 bg-[#FAFAF9] flex items-center justify-center relative overflow-hidden border-b border-[#F4F4F5]">
                {file.previewUrl ? (
                  <img 
                    src={file.previewUrl} 
                    alt={file.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#71717A]">
                    {file.type === 'pdf' ? (
                      <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-bold text-xs shadow-xs">
                        PDF
                      </div>
                    ) : file.type === 'csv' ? (
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-xs">
                        CSV
                      </div>
                    ) : file.type === 'svg' ? (
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#635BFF] flex items-center justify-center font-bold text-xs shadow-xs">
                        SVG
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shadow-xs">
                        DOC
                      </div>
                    )}
                  </div>
                )}

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button 
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 bg-white/90 backdrop-blur-xs text-[#71717A] hover:text-red-600 rounded-lg shadow-xs hover:bg-white"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* File Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[#18181B] truncate group-hover:text-[#635BFF] transition-colors" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#71717A] mt-1">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>Used in {file.boardCount} {file.boardCount === 1 ? 'board' : 'boards'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#F4F4F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {file.uploadedAt}
                  </span>

                  <Link
                    href={`/canvas?import=${file.id}`}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#635BFF] hover:text-[#5248E5]"
                  >
                    Add to Canvas <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#E4E4E7] rounded-2xl p-8">
            <HardDrive className="w-10 h-10 text-[#A1A1AA] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#18181B]">No files match your search</h3>
            <p className="text-xs text-[#71717A] mt-1">Upload assets or clear your active filter.</p>
          </div>
        )}
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
