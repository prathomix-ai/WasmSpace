import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | MasmSpace AI Whiteboard",
  description: "Pro-company Cookie Policy for MasmSpace AI Smart Whiteboard SaaS platform by PRATHOMIX.",
};

export default function CookiePolicyPage() {
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to MasmSpace Home
          </Link>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>LEGAL SPECIFICATION // DOC-CK-2026</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Title Header */}
        <div className="border-b border-zinc-800 pb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
            Effective Date: September 9, 2026 • Version 2.4 (Enterprise Defense)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            MASMSPACE COOKIE &amp; LOCAL STORAGE POLICY
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This Cookie Policy constitutes a binding legal agreement governing the operation of cookies, Web Storage (localStorage, sessionStorage), IndexedDB, and related telemetry on the MasmSpace SaaS platform (&ldquo;Platform&rdquo;, &ldquo;Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operated by PRATHOMIX (&ldquo;Company&rdquo;).
          </p>
        </div>

        {/* Warning Banner: Zero Liability for Cookie Blocking */}
        <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm tracking-wide uppercase">
            <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            CRITICAL SERVICE WARNING: ZERO LIABILITY FOR COOKIE BLOCKING
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            MasmSpace is an advanced, distributed, real-time AI operating system. <strong>Essential cookies and local web storage tokens are strictly indispensable for core operations</strong>, including WebSocket multiplayer canvas synchronization, Board Brain vector RAG retrieval, WebAssembly sandbox security, and encrypted authentication. If you or your enterprise IT policy disable, block, reject, flush, or modify cookies or browser storage, <strong>the application will suffer fatal degradation, data loss, or complete failure</strong>. The Company expressly disclaims any and all liability for unsaved drawings, deleted boards, session desynchronization, or consequential business damages resulting therefrom.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-mono">
            <span className="text-neon-cyan">01.</span> Scope &amp; Technology Definitions
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            In this Policy, &ldquo;Cookies&rdquo; collectively refers to standard browser HTTP cookies, HTML5 LocalStorage, SessionStorage, IndexedDB records, WebSockets connection handshakes, and cryptographic session tokens utilized to maintain persistent connection states across our distributed web infrastructure.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            By accessing or using the MasmSpace platform, you expressly authorize and consent to the placement, reading, and transmission of Essential and Technical Storage Objects on your device as defined herein.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-mono">
            <span className="text-neon-cyan">02.</span> Mandatory Essential Cookies &amp; Platform Architecture
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Unlike static promotional websites, MasmSpace operates an event-driven collaborative whiteboard engine. The following cookies and client-side storage objects are <strong>MANDATORY</strong> and cannot be opted out of without terminating the functionality of the Service:
          </p>

          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/50">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-300">
              <thead className="bg-zinc-800/80 text-zinc-400 font-mono text-xs uppercase border-b border-zinc-700">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Core Purpose</th>
                  <th className="p-3">Storage Mechanism</th>
                  <th className="p-3">Opt-Out Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr>
                  <td className="p-3 font-semibold text-neon-cyan">Authentication &amp; Security</td>
                  <td className="p-3">
                    Validates user identity, enforces role-based access control (RBAC), prevents Cross-Site Request Forgery (CSRF), and preserves cryptographic JWT tokens.
                  </td>
                  <td className="p-3 font-mono text-xs">Secure HttpOnly Cookie / LocalStorage</td>
                  <td className="p-3 text-red-400 font-bold uppercase text-xs">Non-Negotiable</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neon-purple">Multiplayer Sync &amp; CRDT</td>
                  <td className="p-3">
                    Maintains continuous WebSocket transport channels, reconciles conflict-free replicated data types (CRDT) between concurrent editors, and syncs live cursor coordinates.
                  </td>
                  <td className="p-3 font-mono text-xs">SessionStorage &amp; Socket Tokens</td>
                  <td className="p-3 text-red-400 font-bold uppercase text-xs">Non-Negotiable</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neon-green">Board Brain (Vector RAG Search)</td>
                  <td className="p-3">
                    Caches transient vector search sessions, similarity threshold parameters, and active embedding indexes to enable sub-second natural language canvas queries.
                  </td>
                  <td className="p-3 font-mono text-xs">IndexedDB &amp; Memory Cache</td>
                  <td className="p-3 text-red-400 font-bold uppercase text-xs">Non-Negotiable</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-zinc-200">Local Canvas State &amp; Pyodide WASM</td>
                  <td className="p-3">
                    Persists offline shape modifications, tree explorer layouts, undo/redo stacks, and Pyodide WebAssembly sandboxed runtime packages in your browser memory.
                  </td>
                  <td className="p-3 font-mono text-xs">IndexedDB / LocalStorage</td>
                  <td className="p-3 text-red-400 font-bold uppercase text-xs">Non-Negotiable</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-mono">
            <span className="text-neon-cyan">03.</span> Strict Disclaimer Regarding Third-Party Infrastructure Cookies
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            MasmSpace interfaces with premier third-party cloud service providers, vector databases, and AI inference networks (including, but not limited to, Supabase Inc., Hugging Face Inc., Cloudflare Inc., Amazon Web Services, and CDN delivery networks) to deliver scalable computational power.
          </p>
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 text-xs sm:text-sm text-zinc-300">
            <div className="font-bold text-zinc-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Complete Immunity from Third-Party Tracking &amp; Breach Liability
            </div>
            <p>
              Third-party infrastructure providers may place automated diagnostic identifiers, bot-detection cookies (such as Cloudflare Ray / Turnstile tokens), edge routing tokens, or network latency cookies upon your HTTP requests. <strong>The Company exercises no direct ownership, operational custody, or code-level control over third-party cookies.</strong>
            </p>
            <p>
              Under no circumstances shall PRATHOMIX, its directors, employees, or affiliates be held liable for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Any privacy violation, tracking, or data collection executed by external infrastructure or AI host networks;</li>
              <li>Unauthorized security breaches, cyberattacks, zero-day vulnerabilities, or interception events originating from third-party server tiers or cookie data stores;</li>
              <li>Discrepancies between third-party privacy notices and external regulatory enforcement regimes.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-mono">
            <span className="text-neon-cyan">04.</span> User Cookie Blocking: Fatal Degradation &amp; Zero Liability
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Users retain the theoretical right through their web browser configurations, privacy extensions, incognito windows, or ad-blocking utilities to reject, block, or flush cookies and storage objects. However, you acknowledge and agree to the following contractual caveats:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-sm space-y-2">
              <div className="font-semibold text-white flex items-center gap-2 font-mono">
                <span className="text-red-400">✦</span> A. Immediate Breakdown of Core Features
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Blocking cookies terminates the WebSocket handshake, immediately rendering real-time collaborative whiteboarding, live multi-cursor tracking, and vector-based Board Brain queries completely non-functional.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-sm space-y-2">
              <div className="font-semibold text-white flex items-center gap-2 font-mono">
                <span className="text-red-400">✦</span> B. Total Data Loss &amp; Desynchronization
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Without LocalStorage and IndexedDB access, the client engine cannot retain optimistic UI strokes, shape properties, or auto-save snapshots. Unsaved drawings, complex diagrams, and meeting transcript notes will be irreversibly erased upon page refresh or network disconnection.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/80 border border-red-500/30 bg-red-950/10 text-sm space-y-2">
              <div className="font-semibold text-red-300 flex items-center gap-2 font-mono">
                <span className="text-red-400">⚠</span> C. Absolute Company Hold-Harmless Release
              </div>
              <p className="text-zinc-300 text-xs sm:text-sm font-medium">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE JURISDICTIONAL LAW, THE COMPANY DISCLAIMS ALL DIRECT, INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, DATA LOSS, CORRUPTED INTELLECTUAL PROPERTY, OR WORK PRODUCT DEFECTS CAUSED DIRECTLY OR INDIRECTLY BY THE CLIENT&apos;S RESTRICTION, ERASURE, OR BLOCKING OF PLATFORM COOKIES OR WEB STORAGE MECHANISMS.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-mono">
            <span className="text-neon-cyan">05.</span> Browser Controls &amp; Management
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Most modern web browsers allow users to inspect and manage cookies through their settings panel (e.g., Chrome Settings &gt; Privacy and Security &gt; Cookies; Mozilla Firefox &gt; Preferences &gt; Privacy &amp; Security). You may delete stored data at any time, subject to the explicit understanding that your active MasmSpace canvas session will be immediately severed and unsaved progress permanently forfeited.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-4 border-t border-zinc-800 pt-8">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-mono">
            <span className="text-neon-cyan">06.</span> Amendments &amp; Contact Inquiries
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            PRATHOMIX reserves the unilateral right to amend, alter, or update this Cookie Policy at any time without prior individual notice by publishing the updated version with a revised timestamp. Continued invocation of the Platform following any revision manifests unreserved acceptance of the revised policies.
          </p>
          <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-sm space-y-2">
            <p className="text-zinc-200 font-semibold font-mono">Corporate Legal &amp; Compliance Office:</p>
            <p className="text-zinc-400 text-xs">
              Entity: PRATHOMIX SOLUTION (MasmSpace Division)<br />
              Digital Portal:{" "}
              <a
                href="https://prathomix.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:underline"
              >
                https://prathomix.tech
              </a>
              <br />
              Legal &amp; Privacy Contact:{" "}
              <a href="mailto:support@prathomix.tech" className="text-neon-cyan hover:underline">
                support@prathomix.tech
              </a>{" "}
              /{" "}
              <a href="mailto:hello@prathomix.tech" className="text-neon-cyan hover:underline">
                hello@prathomix.tech
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 mt-16 text-center text-xs text-zinc-500 font-mono">
        MasmSpace AI OS • Powered by{" "}
        <a
          href="https://prathomix.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-300 hover:text-neon-cyan transition-colors font-bold"
        >
          PRATHOMIX
        </a>
      </footer>
    </div>
  );
}
