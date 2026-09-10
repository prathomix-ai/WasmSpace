import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = "https://wasmspace.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WasmSpace | Next-Gen AI & WebAssembly Workspace",
    template: "%s | WasmSpace",
  },
  description:
    "Architect, brainstorm, and execute code directly in your browser. WasmSpace is the infinite AI-powered whiteboard with native WebAssembly runtime, real-time collaboration, and intelligent system modeling.",
  keywords: [
    "WasmSpace",
    "WebAssembly IDE",
    "AI Whiteboard",
    "Infinite Canvas",
    "In-Browser Code Execution",
    "Pyodide Python",
    "Excalidraw Collaboration",
    "Real-time Whiteboard",
    "System Architecture Tool",
    "Visual Programming",
    "Technical Canvas",
    "AI Workspace",
  ],
  authors: [{ name: "WasmSpace Team", url: siteUrl }],
  creator: "WasmSpace",
  publisher: "WasmSpace",
  applicationName: "WasmSpace",
  category: "technology",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "WasmSpace | Next-Gen AI & WebAssembly Workspace",
    description:
      "Architect, brainstorm, and execute code in real time. The infinite AI-powered whiteboard with native WebAssembly runtime and collaborative intelligence.",
    url: siteUrl,
    siteName: "WasmSpace",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/wasmspace-logo.png",
        width: 1200,
        height: 630,
        alt: "WasmSpace — Next-Gen AI & WebAssembly Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WasmSpace | Next-Gen AI & WebAssembly Workspace",
    description:
      "Architect, brainstorm, and execute code in real time. The infinite AI-powered whiteboard with native WebAssembly runtime.",
    creator: "@wasmspace",
    images: ["/wasmspace-logo.png"],
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
    icon: "/wasmspace-logo.png",
    shortcut: "/wasmspace-logo.png",
    apple: "/wasmspace-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </head>
      <body
        className="antialiased min-h-screen bg-slate-50 dark:bg-void text-zinc-900 dark:text-zinc-100 transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
