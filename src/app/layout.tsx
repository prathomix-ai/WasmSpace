import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import GlobalToast from "@/components/GlobalToast";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05070f" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = "https://prathomix.tech";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MasmSpace | Next-Gen AI & Developer Workspace - Powered by Prathomix",
    template: "%s | MasmSpace - Powered by Prathomix",
  },
  description:
    "Experience MasmSpace — the modern AI & cloud architecture workspace powered by Prathomix. Brainstorm, diagram, and execute code in real-time with native WebAssembly, multi-agent AI intelligence, Next.js App Router speed, and high-performance Python FastAPI & Supabase backend.",
  keywords: [
    "MasmSpace",
    "MasmSpace AI",
    "Prathomix",
    "Powered by Prathomix",
    "AI workspace",
    "developer tools",
    "Next.js",
    "FastAPI",
    "SaaS",
    "cloud architecture",
    "WebAssembly IDE",
    "AI whiteboard",
    "real-time collaboration",
    "Supabase",
    "code execution",
    "system architecture modeling",
    "infinite canvas",
    "developer productivity",
    "Pyodide Python",
  ],
  authors: [{ name: "Prathomix Team", url: siteUrl }],
  creator: "MasmSpace by Prathomix",
  publisher: "PRATHOMIX SOLUTION",
  applicationName: "MasmSpace",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MasmSpace | Next-Gen AI & Developer Workspace - Powered by Prathomix",
    description:
      "Step into MasmSpace, a high-performance cloud architecture workspace powered by Prathomix. Uniting Next.js, Python FastAPI, and Supabase with autonomous AI agents and in-browser code execution.",
    url: siteUrl,
    siteName: "MasmSpace - Powered by Prathomix",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "MasmSpace — Next-Gen AI & Developer Workspace Powered by Prathomix",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MasmSpace | Next-Gen AI & Developer Workspace - Powered by Prathomix",
    description:
      "High-performance cloud architecture workspace. Powered by Prathomix with Next.js, Python FastAPI, Supabase, and WebAssembly code execution.",
    creator: "@prathomix",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "MasmSpace",
      description:
        "Next-Gen AI & Developer Workspace powered by Prathomix featuring modern UI, native WebAssembly runtime, Next.js App Router, Python FastAPI, and Supabase.",
      publisher: {
        "@type": "Organization",
        name: "PRATHOMIX SOLUTION",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/logo.png`,
        },
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/canvas?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      "inLanguage": "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "MasmSpace",
      url: siteUrl,
      operatingSystem: "Web Browser, Windows, macOS, Linux",
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "AI Developer Workspace & Collaborative Canvas",
      description:
        "Modern AI & Developer Workspace powered by Prathomix with native WebAssembly code execution, collaborative whiteboard canvas, and autonomous AI system design.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1280",
        bestRating: "5",
        worstRating: "1",
      },
      softwareVersion: "2.4.0",
      featureList: [
        "Modern clean dark aesthetic UI",
        "Infinite collaborative whiteboard canvas",
        "In-browser WebAssembly Python execution",
        "Python FastAPI backend with RAG vector search",
        "Supabase real-time cloud database and auth",
        "AI-assisted system architecture diagramming",
      ],
      screenshot: `${siteUrl}/logo.png`,
      author: {
        "@type": "Organization",
        name: "PRATHOMIX SOLUTION",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="antialiased min-h-screen bg-[#09090b] text-zinc-100 transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SubscriptionProvider>
            <SubscriptionGuard />
            <GlobalToast />
            {children}
          </SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
