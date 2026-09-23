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
  HelpCircle,
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
    <header className="sticky top-0 z-50 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-[#E4E4E7] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-85"
            title="MasmSpace Home"
          >
            <div className="relative w-7 h-6 flex items-center justify-center shrink-0">
              <Image
                src="/masmspace-logo.png"
                alt="MasmSpace"
                width={28}
                height={22}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#18181B]">
              MasmSpace
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                      : "text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]"
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
            className="hidden sm:flex items-center gap-1 p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </Link>
          <Link
            href="/billing"
            className="hidden sm:flex items-center gap-1 p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
            title="Billing & Plans"
          >
            <CreditCard className="w-4 h-4" />
          </Link>
          <Link
            href="/support"
            className="hidden sm:flex items-center gap-1 p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-[#E4E4E7] mx-1 hidden sm:block" />

          <Link
            href="/canvas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <span>Launch Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
