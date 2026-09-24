"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  LayoutGrid,
  FolderGit2,
  FileBox,
  LayoutTemplate,
  Search,
  Settings,
  CreditCard,
  Keyboard,
} from "lucide-react";

interface HubNavigationProps {
  currentTab?: string;
}

export default function HubNavigation({ currentTab }: HubNavigationProps = {}) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Boards", icon: LayoutGrid },
    { href: "/projects", label: "Projects", icon: FolderGit2 },
    { href: "/files", label: "Files", icon: FileBox },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/search", label: "Search", icon: Search },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 h-[52px] bg-[#171719] border-b border-[#2A2A2F] text-[#F4F4F5] select-none">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            title="MasmSpace Home"
          >
            <div className="relative w-6 h-6 flex items-center justify-center rounded bg-[#1C1C1F] border border-[#2A2A2F]">
              <Image
                src="/masmspace-logo.png"
                alt="MasmSpace"
                width={18}
                height={18}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-xs tracking-tight text-[#F4F4F5]">
              MasmSpace
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/boards");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-semibold"
                      : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Quick Links & Primary Launch CTA */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/shortcuts"
            className="hidden sm:flex items-center gap-1 p-1.5 rounded-md text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </Link>
          <Link
            href="/billing"
            className="hidden sm:flex items-center gap-1 p-1.5 rounded-md text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors"
            title="Billing & Plans"
          >
            <CreditCard className="w-4 h-4" />
          </Link>
          <Link
            href="/canvas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-white text-xs font-medium transition-all"
          >
            <span>Launch Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
