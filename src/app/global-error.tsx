"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MasmSpace Global Kernel Boundary Exception]:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MasmSpace - System Recovery</title>
      </head>
      <body
        style={{
          backgroundColor: "#09090b",
          color: "#f4f4f5",
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "1.5rem",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
            borderRadius: "1.5rem",
            backgroundColor: "#111217",
            border: "1px solid #27272a",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Logo badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #00f5ff, #6366f1)",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              M
            </div>
            <span style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "-0.02em" }}>
              MasmSpace
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#71717a",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Powered by PRATHOMIX
            </span>
          </div>

          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto 1.25rem",
              borderRadius: "1rem",
              background: "rgba(0, 245, 255, 0.1)",
              border: "1px solid rgba(0, 245, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
            }}
          >
            ⚡
          </div>

          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: "800",
              letterSpacing: "-0.02em",
              margin: "0 0 0.75rem",
              color: "#ffffff",
            }}
          >
            System Recovery Mode
          </h1>

          <p
            style={{
              fontSize: "0.8125rem",
              color: "#a1a1aa",
              lineHeight: 1.6,
              margin: "0 0 1.5rem",
            }}
          >
            MasmSpace isolated a critical runtime failure to prevent data corruption. Your diagrams remain preserved in local storage. Click below to reboot the canvas kernel.
          </p>

          {error?.digest && (
            <div
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                color: "#71717a",
                marginBottom: "1.5rem",
              }}
            >
              Incident ID: {error.digest}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                background: "linear-gradient(90deg, #00f5ff, #06b6d4)",
                color: "#09090b",
                fontWeight: "700",
                fontSize: "0.8125rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.5rem",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(0, 245, 255, 0.25)",
              }}
            >
              ↻ Reboot MasmSpace
            </button>
            <a
              href="/"
              style={{
                backgroundColor: "#18181b",
                color: "#e4e4e7",
                fontWeight: "600",
                fontSize: "0.8125rem",
                textDecoration: "none",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.25rem",
                border: "1px solid #3f3f46",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
