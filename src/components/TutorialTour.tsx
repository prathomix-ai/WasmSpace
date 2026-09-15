"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";

export interface TutorialTourProps {
  /**
   * If true, forces the tour to start even if hasSeenTutorial is true.
   * Useful for "Restart Tutorial" buttons in Settings or Help menus.
   */
  forceStart?: boolean;
  onTourComplete?: () => void;
}

const STORAGE_KEY = "hasSeenTutorial";

export function TutorialTour({ forceStart = false, onTourComplete }: TutorialTourProps) {
  const driverInstanceRef = useRef<Driver | null>(null);

  const startTour = useCallback(() => {
    // 1. Build and configure the Driver.js tour instance targeting exact selectors
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.82)",
      stagePadding: 8,
      stageRadius: 16,
      popoverClass: "masmspace-tour-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Get Started 🚀",
      showButtons: ["next", "previous", "close"],
      onDestroyStarted: () => {
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch { }
        driverObj.destroy();
        onTourComplete?.();
      },
      steps: [
        {
          element: "#app-left-sidebar",
          popover: {
            title: "⚡ Command Sidebar",
            description: "Here you can access Voice AI, Code Studio, Project Files, and Settings.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#whiteboard-canvas-container",
          popover: {
            title: "🎨 Infinite Canvas",
            description: "This is your infinite multiplayer whiteboard with sub-millisecond 60 FPS pan and zoom.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: document.querySelector(".excalidraw .App-toolbar")
            ? ".excalidraw .App-toolbar"
            : document.querySelector(".App-toolbar-container")
            ? ".App-toolbar-container"
            : "#canvas-compact-save-btn",
          popover: {
            title: "🛠️ Creation Toolbar",
            description: "Switch between freehand drawing, geometric shapes, arrows, and text tools.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#canvas-compact-save-btn",
          popover: {
            title: "💾 Cloud Save",
            description: "Click here to manually save your canvas progress to Supabase cloud storage.",
            side: "bottom",
            align: "start",
          },
        },
      ],
    });

    driverInstanceRef.current = driverObj;
    driverObj.drive();
  }, [onTourComplete]);

  useEffect(() => {
    // 2. Check localStorage flag to only run for first-time users
    if (typeof window === "undefined") return;

    let hasSeen = false;
    try {
      hasSeen = localStorage.getItem(STORAGE_KEY) === "true";
    } catch { }

    if (!hasSeen || forceStart) {
      let attempts = 0;
      const maxAttempts = 25; // 25 * 200ms = 5s max check for Excalidraw chunk mounting
      const pollTimer = setInterval(() => {
        attempts++;
        const sidebar = document.querySelector("#app-left-sidebar") || document.querySelector("[data-tour='sidebar']");
        const canvas = document.querySelector("#whiteboard-canvas-container") || document.querySelector("[data-tour='canvas']");

        if ((sidebar && canvas) || attempts >= maxAttempts) {
          clearInterval(pollTimer);
          // Give 250ms for layout stability
          setTimeout(() => {
            startTour();
          }, 250);
        }
      }, 200);

      return () => {
        clearInterval(pollTimer);
        if (driverInstanceRef.current) {
          driverInstanceRef.current.destroy();
        }
      };
    }
  }, [forceStart, startTour]);

  return (
    <>
      {/* ── Cyberpunk Dark Theme Styles for Driver.js Popover ── */}
      <style jsx global>{`
        .masmspace-tour-popover {
          background: rgba(9, 9, 11, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1.5px solid rgba(6, 182, 212, 0.45) !important;
          box-shadow: 0 0 35px rgba(6, 182, 212, 0.25), 0 10px 40px rgba(0, 0, 0, 0.8) !important;
          border-radius: 20px !important;
          padding: 18px 20px !important;
          color: #f4f4f5 !important;
          max-width: 340px !important;
          font-family: inherit !important;
        }

        .masmspace-tour-popover .driver-popover-title {
          font-size: 15px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          letter-spacing: -0.01em !important;
          margin-bottom: 6px !important;
        }

        .masmspace-tour-popover .driver-popover-description {
          font-size: 13px !important;
          line-height: 1.55 !important;
          color: #a1a1aa !important;
          margin-bottom: 16px !important;
        }

        .masmspace-tour-popover .driver-popover-progress-text {
          font-size: 11px !important;
          font-family: monospace !important;
          color: #22d3ee !important;
          font-weight: 600 !important;
        }

        .masmspace-tour-popover .driver-popover-footer {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 8px !important;
          margin-top: 14px !important;
          padding-top: 12px !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        /* Next Button */
        .masmspace-tour-popover .driver-popover-next-btn {
          background: linear-gradient(135deg, #22d3ee, #06b6d4) !important;
          color: #000000 !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          padding: 6px 14px !important;
          border-radius: 10px !important;
          border: none !important;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.4) !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
          text-shadow: none !important;
        }

        .masmspace-tour-popover .driver-popover-next-btn:hover {
          background: #38bdf8 !important;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.6) !important;
          transform: translateY(-1px) !important;
        }

        /* Previous Button */
        .masmspace-tour-popover .driver-popover-prev-btn {
          background: rgba(255, 255, 255, 0.06) !important;
          color: #d4d4d8 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 6px 12px !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
          text-shadow: none !important;
        }

        .masmspace-tour-popover .driver-popover-prev-btn:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          color: #ffffff !important;
        }

        /* Skip / Close Button */
        .masmspace-tour-popover .driver-popover-close-btn {
          color: #71717a !important;
          font-size: 16px !important;
          padding: 4px !important;
          transition: color 0.15s ease !important;
        }

        .masmspace-tour-popover .driver-popover-close-btn:hover {
          color: #f43f5e !important;
        }

        .masmspace-tour-popover .driver-popover-arrow-side-left.driver-popover-arrow {
          border-right-color: rgba(6, 182, 212, 0.45) !important;
        }
        .masmspace-tour-popover .driver-popover-arrow-side-right.driver-popover-arrow {
          border-left-color: rgba(6, 182, 212, 0.45) !important;
        }
        .masmspace-tour-popover .driver-popover-arrow-side-top.driver-popover-arrow {
          border-bottom-color: rgba(6, 182, 212, 0.45) !important;
        }
        .masmspace-tour-popover .driver-popover-arrow-side-bottom.driver-popover-arrow {
          border-top-color: rgba(6, 182, 212, 0.45) !important;
        }
      `}</style>
    </>
  );
}

export default TutorialTour;
