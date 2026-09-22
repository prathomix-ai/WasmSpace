import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | MasmSpace - Powered by Prathomix",
  description: "Terms and Conditions governing the use of MasmSpace AI SaaS platform operated by PRATHOMIX SOLUTION.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas-dark text-zinc-100 font-sans selection:bg-neon-cyan/20 selection:text-neon-cyan">
      {/* Background Gradients */}
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
            LEGAL MASTER AGREEMENT // TERMS-2026
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        <div className="border-b border-zinc-800 pb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
            Effective Date: September 9, 2026 • Commercial Pro-Company Edition
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            TERMS &amp; CONDITIONS OF SERVICE
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Client&rdquo;, or &ldquo;Subscriber&rdquo;) and PRATHOMIX SOLUTION (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing access to and usage of the MasmSpace Smart Whiteboard platform (&ldquo;Platform&rdquo;, &ldquo;Service&rdquo;).
          </p>
        </div>

        {/* 1. Acceptance */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">1. Acceptance of Terms</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            By creating an account, accessing, drawing upon, or authenticating into the MasmSpace platform, you unconditionally accept and agree to be bound by all provisions within this Master Agreement. If you do not agree to these terms in their entirety, you must terminate use immediately.
          </p>
        </section>

        {/* 2. As-Is Provision */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">2. &ldquo;As-Is&rdquo; &amp; &ldquo;As-Available&rdquo; Provision</h2>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed">
            THE PLATFORM, INCLUDING ALL REAL-TIME COLLABORATIVE TOOLS, AI MEETING SUMMARIES, IN-BROWSER CODE RUNNERS, VECTOR EMBEDDINGS, AND CANVAS STORAGE TIERS, IS PROVIDED STRICTLY ON AN &ldquo;AS-IS&rdquo; AND &ldquo;AS-AVAILABLE&rdquo; BASIS WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT.
          </div>
        </section>

        {/* 3. AI Disclaimer & Hallucinations */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">3. Artificial Intelligence Disclaimer (Zero Liability for Hallucinations)</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            MasmSpace incorporates cutting-edge Large Language Models (LLMs), neural semantic search, and WebAssembly Python compilers. You expressly recognize and acknowledge:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-zinc-400">
            <li><strong>AI Hallucinations &amp; Inaccuracies:</strong> Generative models may output mathematically false, architecturally flawed, non-compiling, or factually inaccurate diagrams, code blocks, or meeting summaries.</li>
            <li><strong>Independent Verification Required:</strong> The Client is solely responsible for inspecting, testing, and verifying any AI-generated code or architecture diagrams prior to deployment into production systems.</li>
            <li><strong>Zero Company Liability:</strong> The Company shall bear strictly zero liability for business errors, server crashes, security exploits, or financial loss stemming from reliance on AI-generated outputs.</li>
          </ul>
        </section>

        {/* 4. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">4. Strict Limitation of Liability &amp; Data Loss Exclusions</h2>
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed space-y-2">
            <p>
              UNDER NO CIRCUMSTANCES SHALL PRATHOMIX SOLUTION, ITS FOUNDERS, EMPLOYEES, AFFILIATES, OR PARTNERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>LOSS OF CANVAS DATA, BRAINSTORMING ARTIFACTS, CODE SNIPPETS, OR DRAWINGS;</li>
              <li>THIRD-PARTY INFRASTRUCTURE OUTAGES (E.G., CLOUDFLARE, SUPABASE, AWS, HUGGING FACE DOWNTIME);</li>
              <li>CYBERATTACKS, ZERO-DAY EXPLOITS, OR CLOUD STORAGE PENETRATIONS BY MALICIOUS ACTORS;</li>
              <li>BUSINESS INTERRUPTION, LOSS OF REVENUE, OR DAMAGE TO CLIENT REPUTATION.</li>
            </ul>
            <p>
              IN ANY EVENT, THE MAXIMUM AGGREGATE LIABILITY OF THE COMPANY SHALL NOT EXCEED THE TOTAL FEES PAID BY THE USER IN THE PRECEDING ONE (1) MONTH PERIOD, OR $50.00 USD, WHICHEVER IS LESS.
            </p>
          </div>
        </section>

        {/* 5. User Content & Indemnification */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white font-mono">5. User Content &amp; Full Client Indemnification</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            The User retains copyright over original whiteboard content created, but assumes full responsibility for all uploaded materials, imported PDF documents, and proprietary data pasted into the canvas.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            <strong>Indemnification Obligation:</strong> You agree to fully defend, indemnify, and hold harmless PRATHOMIX SOLUTION and its affiliates from and against any claims, liabilities, lawsuits, judgments, legal fees, or damages arising out of: (i) your misuse of the Service; (ii) any copyright, patent, or privacy infringement contained within your canvas content; or (iii) any breach of these Terms.
          </p>
        </section>

        {/* 6. Governing Law & Corporate Info */}
        <section className="space-y-3 border-t border-zinc-800 pt-8">
          <h2 className="text-xl font-bold text-white font-mono">6. Governing Law &amp; Legal Desk</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            These Terms shall be interpreted and enforced under the laws of the jurisdiction governing PRATHOMIX SOLUTION platform operations.
          </p>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 space-y-1">
            <div>Operating Body: PRATHOMIX SOLUTION (MasmSpace Platform)</div>
            <div>Web Portal: <a href="https://prathomix.tech" className="text-neon-cyan hover:underline">https://prathomix.tech</a></div>
            <div>Legal Inquiries: <a href="mailto:support@prathomix.tech" className="text-neon-cyan hover:underline">support@prathomix.tech</a></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 text-center text-xs text-zinc-500 font-mono">
        MasmSpace AI OS • Powered by{" "}
        <a href="https://prathomix.tech" className="text-zinc-300 hover:text-neon-cyan transition-colors font-bold">
          PRATHOMIX SOLUTION
        </a>
      </footer>
    </div>
  );
}
