"use client";

import React, { useEffect, useRef, useCallback } from "react";

export interface DraggablePropertiesMenuProps {
  canvasContainerId?: string;
}

/**
 * DraggablePropertiesMenu
 * Attaches to the Excalidraw container, observes the `.App-menu_bottom--left`
 * properties panel DOM node, injects an intuitive drag handle header, and
 * enables smooth dragging anywhere across the screen without interfering
 * with inner color buttons, opacity sliders, or stroke pickers.
 */
export function DraggablePropertiesMenu({
  canvasContainerId = "whiteboard-canvas-container",
}: DraggablePropertiesMenuProps) {
  // Store dragged offsets so position persists across element selections
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ mouseX: number; mouseY: number }>({ mouseX: 0, mouseY: 0 });
  const activePanelRef = useRef<HTMLElement | null>(null);

  const applyPosition = useCallback((panel: HTMLElement, x: number, y: number) => {
    panel.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const resetPosition = useCallback((panel: HTMLElement) => {
    positionRef.current = { x: 0, y: 0 };
    panel.style.transform = "translate3d(0px, 0px, 0px)";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cleanupMouseListeners: (() => void) | null = null;

    function attachDraggableToPanel(panel: HTMLElement) {
      if (panel.dataset.draggableAttached === "true") {
        // Already attached, but re-apply existing dragged coordinates
        applyPosition(panel, positionRef.current.x, positionRef.current.y);
        return;
      }

      panel.dataset.draggableAttached = "true";
      panel.classList.add("masmspace-draggable-properties-panel");

      // Ensure panel can move freely above canvas
      panel.style.position = "fixed";
      panel.style.zIndex = "35";
      panel.style.touchAction = "none";
      applyPosition(panel, positionRef.current.x, positionRef.current.y);

      // Inject custom Cyberpunk Drag Handle Header if not already present
      let handle = panel.querySelector(".masmspace-drag-handle") as HTMLElement | null;
      if (!handle) {
        handle = document.createElement("div");
        handle.className = "masmspace-drag-handle";
        handle.innerHTML = `
          <div class="drag-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drag-icon">
              <circle cx="9" cy="5" r="1"></circle>
              <circle cx="9" cy="12" r="1"></circle>
              <circle cx="9" cy="19" r="1"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <circle cx="15" cy="12" r="1"></circle>
              <circle cx="15" cy="19" r="1"></circle>
            </svg>
            <span>Properties</span>
          </div>
          <button type="button" class="drag-reset-btn" title="Reset Menu Position">↺</button>
        `;

        // Prepend handle at top of menu
        panel.prepend(handle);

        const resetBtn = handle.querySelector(".drag-reset-btn");
        if (resetBtn) {
          resetBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            resetPosition(panel);
          });
        }
      }

      // Drag Event Listeners
      const onMouseDown = (e: MouseEvent) => {
        // CRITICAL CHECK: Ignore clicks on inner inputs, buttons, color swatches, or sliders
        const target = e.target as HTMLElement | null;
        if (!target) return;

        const isHandleClick = Boolean(target.closest(".masmspace-drag-handle"));
        const isInteractiveChild = Boolean(
          target.closest(
            'button:not(.drag-reset-btn), input, select, textarea, label, [role="button"], [role="slider"], .color-picker'
          )
        );

        if (isInteractiveChild && !isHandleClick) {
          return; // Let the color picker or button handle the click normally
        }

        // Only start drag on left click
        if (e.button !== 0) return;

        isDraggingRef.current = true;
        activePanelRef.current = panel;
        startPosRef.current = {
          mouseX: e.clientX - positionRef.current.x,
          mouseY: e.clientY - positionRef.current.y,
        };

        panel.classList.add("is-dragging");
        document.body.style.userSelect = "none";
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !activePanelRef.current) return;

        let nextX = e.clientX - startPosRef.current.mouseX;
        let nextY = e.clientY - startPosRef.current.mouseY;

        // Viewport bounds clamping
        const rect = activePanelRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - 80;

        // Allow free positioning across the entire screen
        nextX = Math.max(-rect.left + positionRef.current.x + 10, Math.min(maxX, nextX));
        nextY = Math.max(-rect.top + positionRef.current.y + 10, Math.min(maxY, nextY));

        positionRef.current = { x: nextX, y: nextY };
        applyPosition(activePanelRef.current, nextX, nextY);
      };

      const onMouseUp = () => {
        if (isDraggingRef.current && activePanelRef.current) {
          activePanelRef.current.classList.remove("is-dragging");
        }
        isDraggingRef.current = false;
        activePanelRef.current = null;
        document.body.style.userSelect = "";
      };

      panel.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      cleanupMouseListeners = () => {
        panel.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }

    // ── MutationObserver to detect when Excalidraw mounts or updates the properties panel ──
    const container = document.getElementById(canvasContainerId) || document.body;

    const findAndAttach = () => {
      // Excalidraw targets: .App-menu_bottom--left, .properties-panel, or layer-ui island container
      const panels = container.querySelectorAll<HTMLElement>(
        ".App-menu_bottom--left, .excalidraw .layer-ui__wrapper .Island:not(.App-menu_top), [aria-label='Element properties']"
      );
      panels.forEach((p) => attachDraggableToPanel(p));
    };

    findAndAttach();

    const observer = new MutationObserver(() => {
      findAndAttach();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      cleanupMouseListeners?.();
    };
  }, [canvasContainerId, applyPosition, resetPosition]);

  return (
    <>
      <style jsx global>{`
        /* ── Custom Draggable Excalidraw Properties Menu Styling ── */
        .masmspace-draggable-properties-panel {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.2) !important;
          border-radius: 18px !important;
          overflow: visible !important;
          transition: transform 0.05s ease-out, box-shadow 0.2s ease !important;
        }

        .masmspace-draggable-properties-panel.is-dragging {
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.45) !important;
          cursor: grabbing !important;
          transition: none !important;
        }

        /* Drag Handle Header */
        .masmspace-drag-handle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 7px 12px;
          margin-bottom: 6px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px 14px 0 0;
          cursor: grab;
          user-select: none;
          touch-action: none;
          transition: background 0.15s ease;
        }

        .masmspace-drag-handle:hover {
          background: rgba(6, 182, 212, 0.1);
        }

        .masmspace-drag-handle:active {
          cursor: grabbing;
        }

        .masmspace-drag-handle .drag-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          color: #22d3ee;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .masmspace-drag-handle .drag-icon {
          color: #06b6d4;
          opacity: 0.8;
        }

        .masmspace-drag-handle .drag-reset-btn {
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .masmspace-drag-handle .drag-reset-btn:hover {
          color: #22d3ee;
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </>
  );
}

export default DraggablePropertiesMenu;
