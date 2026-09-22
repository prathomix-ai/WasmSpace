// ─────────────────────────────────────────────────────────────────────────────
// Prathomix — Whiteboard Canvas Utilities & Shape Helpers
// ─────────────────────────────────────────────────────────────────────────────

import { type Editor, type TLShape } from "@tldraw/tldraw";

/**
 * Converts a plain string to TLRichText JSON structure expected by tldraw v5+
 */
export function toTLRichText(text: string) {
  const lines = text.split("\n");
  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

/**
 * Robust text extractor from tldraw shapes including plain text and richText blocks
 */
export function extractTextFromShapes(shapes: TLShape[]): string {
  const texts: string[] = [];

  for (const shape of shapes) {
    const props = (shape.props || {}) as Record<string, any>;

    // Check richText document model
    if (props.richText && Array.isArray(props.richText.content)) {
      for (const block of props.richText.content) {
        if (Array.isArray(block.content)) {
          for (const span of block.content) {
            if (typeof span.text === "string" && span.text.trim()) {
              texts.push(span.text.trim());
            }
          }
        }
      }
    }

    // Check legacy or standard text properties
    for (const key of ["text", "label", "value", "content", "name"]) {
      const val = props[key];
      if (typeof val === "string" && val.trim()) {
        texts.push(val.trim());
      }
    }
  }

  return texts.join("\n");
}

/**
 * Creates a sticky note on the canvas
 */
export function addNoteToCanvas(
  editor: Editor,
  text: string,
  x: number,
  y: number,
  color: "violet" | "yellow" | "blue" | "green" | "red" | "orange" = "violet"
) {
  editor.createShape({
    type: "note",
    x,
    y,
    props: {
      color,
      size: "m",
      richText: toTLRichText(text),
    },
  });
}

/**
 * Creates a text block on the canvas
 */
export function addTextToCanvas(
  editor: Editor,
  text: string,
  x: number,
  y: number,
  color: "violet" | "yellow" | "blue" | "light-blue" | "green" | "red" = "light-blue"
) {
  editor.createShape({
    type: "text",
    x,
    y,
    props: {
      color: color as any,
      size: "m",
      richText: toTLRichText(text),
    },
  });
}

/**
 * Creates a geometric shape (rectangle, ellipse, star, etc.) on the canvas
 */
export function addGeoToCanvas(
  editor: Editor,
  geo: any,
  x: number,
  y: number,
  color: any = "violet"
) {
  editor.createShape({
    type: "geo",
    x,
    y,
    props: {
      geo,
      w: 200,
      h: 140,
      color,
      fill: "semi",
    },
  });
}

/**
 * Creates an image / PDF document page on the canvas
 */
export function addImageToCanvas(
  editor: Editor,
  dataUrl: string,
  x: number,
  y: number,
  w: number,
  h: number,
  altText: string = "Imported Document"
) {
  editor.createShape({
    type: "image",
    x,
    y,
    props: {
      w,
      h,
      url: dataUrl,
      assetId: null,
      playing: true,
      crop: null,
      flipX: false,
      flipY: false,
      altText,
    },
  });
}

