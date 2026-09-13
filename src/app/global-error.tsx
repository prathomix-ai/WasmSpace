"use client";

import React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#06070a", color: "#f1f5f9", margin: 0, fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ maxWidth: "420px", textAlign: "center", padding: "32px", borderRadius: "16px", background: "#0e111a", border: "1px solid #27272a" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚡</div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 12px 0" }}>Critical Kernel Exception</h2>
            <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "24px" }}>
              MasmSpace global isolation intercepted an unexpected runtime failure. Click below to reboot the canvas kernel.
            </p>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: "#00f5ff",
                color: "#000",
                fontWeight: "bold",
                border: "none",
                borderRadius: "10px",
                padding: "10px 24px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Reboot MasmSpace
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
