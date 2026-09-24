"use client";

import React, { useState } from "react";
import HubNavigation from "@/components/HubNavigation";
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  Upload,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Clock,
  HardDrive,
} from "lucide-react";

interface FileAsset {
  id: string;
  name: string;
  type: "image" | "pdf" | "document" | "json";
  size: string;
  uploadedAt: string;
  boardCount: number;
}

const INITIAL_FILES: FileAsset[] = [
  {
    id: "f-1",
    name: "system-topology-blueprint.json",
    type: "json",
    size: "42 KB",
    uploadedAt: "2 hours ago",
    boardCount: 3,
  },
  {
    id: "f-2",
    name: "microservices-specifications-v2.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedAt: "Yesterday",
    boardCount: 1,
  },
  {
    id: "f-3",
    name: "cloud-architecture-overview.png",
    type: "image",
    size: "1.2 MB",
    uploadedAt: "3 days ago",
    boardCount: 2,
  },
  {
    id: "f-4",
    name: "event-stream-kafka-schema.json",
    type: "json",
    size: "18 KB",
    uploadedAt: "5 days ago",
    boardCount: 4,
  },
];

export default function FilesPage() {
  const [files, setFiles] = useState<FileAsset[]>(INITIAL_FILES);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteFile = (id: string) => {
    if (window.confirm("Remove file from workspace?")) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F4F4F5] flex flex-col font-sans select-none">
      <HubNavigation currentTab="files" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">
              Files & Assets
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Documents, PDF specifications, JSON topologies, and diagram assets attached to boards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-[#171719] border border-[#2A2A2F] placeholder-[#71717A] text-[#F4F4F5] focus:outline-none focus:border-[#7C6CFF]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json,.pdf,.png,.jpg,.jpeg";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) {
                    const newAsset: FileAsset = {
                      id: `f-${Date.now()}`,
                      name: f.name,
                      type: f.name.endsWith(".json")
                        ? "json"
                        : f.name.endsWith(".pdf")
                        ? "pdf"
                        : "image",
                      size: `${Math.round(f.size / 1024)} KB`,
                      uploadedAt: "Just now",
                      boardCount: 1,
                    };
                    setFiles((prev) => [newAsset, ...prev]);
                  }
                };
                input.click();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-white text-xs font-medium cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* File Cards / List */}
        <div className="border border-[#2A2A2F] rounded-xl bg-[#171719] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2A2A2F] text-[10px] font-mono uppercase text-[#71717A] bg-[#111113]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Linked Boards</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2F]">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-[#1C1C1F] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#F4F4F5]">
                    <div className="flex items-center gap-2.5">
                      {file.type === "json" ? (
                        <FileCode className="w-4 h-4 text-[#7C6CFF]" />
                      ) : file.type === "pdf" ? (
                        <FileText className="w-4 h-4 text-[#F87171]" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-[#4ADE80]" />
                      )}
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#71717A] font-mono">{file.size}</td>
                  <td className="py-3 px-4 text-[#A1A1AA]">{file.boardCount} boards</td>
                  <td className="py-3 px-4 text-[#71717A]">{file.uploadedAt}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 rounded text-[#71717A] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
