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

const siteUrl = "https://masmspace.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MasmSpace | Next-Gen AI & WebAssembly Workspace",
    template: "%s | MasmSpace",
  },
  description:
    "Architect, brainstorm, and execute code directly in your browser. MasmSpace is the infinite AI-powered whiteboard with native WebAssembly runtime, real-time collaboration, and intelligent system modeling.",
  keywords: [
    "MasmSpace",
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
  authors: [{ name: "MasmSpace Team", url: siteUrl }],
  creator: "MasmSpace",
  publisher: "MasmSpace",
  applicationName: "MasmSpace",
  category: "technology",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "MasmSpace | Next-Gen AI & WebAssembly Workspace",
    description:
      "Architect, brainstorm, and execute code in real time. The infinite AI-powered whiteboard with native WebAssembly runtime and collaborative intelligence.",
    url: siteUrl,
    siteName: "MasmSpace",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/masmspace-logo.png",
        width: 1200,
        height: 630,
        alt: "MasmSpace — Next-Gen AI & WebAssembly Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MasmSpace | Next-Gen AI & WebAssembly Workspace",
    description:
      "Architect, brainstorm, and execute code in real time. The infinite AI-powered whiteboard with native WebAssembly runtime.",
    creator: "@masmspace",
    images: ["/masmspace-logo.png"],
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
    icon: "/masmspace-logo.png",
    shortcut: "/masmspace-logo.png",
    apple: "/masmspace-logo.png",
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
