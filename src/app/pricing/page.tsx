import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { PricingSection } from "@/components/PricingSection";

export const metadata: Metadata = {
  title: "Pricing Plans - MasmSpace Starter & Pro (Powered by Prathomix)",
  description:
    "Explore MasmSpace transparent pricing plans powered by Prathomix. Upgrade to Pro for unlimited AI generation, WebAssembly execution, and real-time cloud collaboration.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "MasmSpace Pricing | Starter & Pro Membership - Powered by Prathomix",
    description:
      "Unlock full developer superpowers with MasmSpace Pro, powered by Prathomix. Unlimited AI canvas modeling, Pyodide WebAssembly runner, and secure cloud sync.",
    url: "https://prathomix.tech/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-void text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-8">
        <PricingSection />
      </main>
    </div>
  );
}
