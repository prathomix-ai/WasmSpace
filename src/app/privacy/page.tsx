import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | MasmSpace AI Whiteboard",
  description: "Privacy Policy governing data processing, local execution, and third-party storage on MasmSpace.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas-dark text-zinc-100 font-sans selection:bg-neon-cyan/20 selection:text-neon-cyan">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[160px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-neon-cyan transition-colors"
          >
            ← Back to MasmSpace Home
          </Link>
          <div className="font-mono text-xs text-zinc-500">
            PRIVACY DISCLOSURE // PRIV-2026
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        <div className="border-b border-zinc-800 pb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
            Effective Date: September 9, 2026 • Enterprise Data Defense Edition
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            PRIVACY &amp; DATA PROCESSING POLICY
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This Privacy Policy describes how PRATHOMIX (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) handles information across the MasmSpace AI SaaS platform, specifically highlighting local browser sandboxing and third-party infrastructure boundaries.
          </p>
        </div>

        {/* 1. Core Principle */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">1. Local Execution Philosophy (Zero Server Retention)</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Unlike legacy collaborative suites, MasmSpace processes core code execution locally inside your browser via <strong>WebAssembly (Pyodide WASM)</strong>. Your local Python calculations, scripts, and runtime outputs are executed purely within your device&apos;s memory sandbox without transmission to or retention on our application servers.
          </p>
        </section>

        {/* 2. Third-Party Infrastructure Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">2. Third-Party Cloud Infrastructure &amp; Breach Immunity</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            To provide enterprise-grade scale, database persistence, and AI inference, MasmSpace interfaces with select third-party infrastructure providers:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm text-zinc-400">
            <li><strong>Supabase Inc.</strong> for PostgreSQL database, vector embeddings storage, and real-time WebSockets;</li>
            <li><strong>Hugging Face / Cloudflare</strong> for AI LLM inference endpoints and DDoS edge routing;</li>
            <li><strong>Content Delivery Networks (CDNs)</strong> for rapid asset distribution.</li>
          </ul>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed mt-2">
            <strong>Breach Disclaimer:</strong> The Company utilizes industry-standard cryptographic practices. However, PRATHOMIX holds zero liability for any security breaches, physical intrusions, zero-day vulnerabilities, or interception events originating from third-party cloud hosting providers, vector storage tiers, or external AI model inference APIs.
          </div>
        </section>

        {/* 3. Data Collection */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">3. Information Collected &amp; Purpose</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            We collect only the minimum required information necessary to facilitate software operation:
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
            <table className="w-full text-left text-xs text-zinc-300 font-mono">
              <thead className="bg-zinc-800 text-zinc-400 uppercase border-b border-zinc-700">
                <tr>
                  <th className="p-3">Data Point</th>
                  <th className="p-3">Primary Purpose</th>
                  <th className="p-3">Storage Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr>
                  <td className="p-3 text-neon-cyan">Account Email &amp; Auth ID</td>
                  <td className="p-3">Identity verification, RBAC permissions, and billing tier</td>
                  <td className="p-3">Supabase Auth / Profiles</td>
                </tr>
                <tr>
                  <td className="p-3 text-neon-purple">Canvas Vector Embeddings</td>
                  <td className="p-3">Natural language similarity search (Board Brain RAG)</td>
                  <td className="p-3">Supabase pgvector (encrypted)</td>
                </tr>
                <tr>
                  <td className="p-3 text-neon-green">Canvas Layout State</td>
                  <td className="p-3">Cross-device synchronization and board restoration</td>
                  <td className="p-3">Supabase Database / LocalStorage</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Contact Information */}
        <section className="space-y-3 border-t border-zinc-800 pt-8">
          <h2 className="text-xl font-bold text-white font-mono">4. Corporate Privacy Contact</h2>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 space-y-1">
            <div>Privacy Desk: PRATHOMIX SOLUTION (MasmSpace Division)</div>
            <div>Official Portal: <a href="https://prathomix.tech" className="text-neon-cyan hover:underline">https://prathomix.tech</a></div>
            <div>Inquiries: <a href="mailto:support@prathomix.tech" className="text-neon-cyan hover:underline">support@prathomix.tech</a></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 text-center text-xs text-zinc-500 font-mono">
        MasmSpace AI OS • Powered by{" "}
        <a href="https://prathomix.tech" className="text-zinc-300 hover:text-neon-cyan transition-colors font-bold">
          PRATHOMIX
        </a>
      </footer>
    </div>
  );
}
