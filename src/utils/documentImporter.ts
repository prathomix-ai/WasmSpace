/**
 * Universal Multi-Page Document Importer for React Flow Canvas
 *
 * Supports:
 * 1. Images: Convert to Base64 -> Single locked React Flow node
 * 2. PDFs: Client-side pdfjs-dist -> Loops 1..pdf.numPages -> Renders to off-screen canvas
 *    -> Base64 -> Creates locked React Flow nodes stacked vertically:
 *    `y = startY + (index * (pageHeight + 100))` (100px clean vertical gap)
 * 3. DOCX / PPTX: Calls /api/convert-document -> Returns array of Base64 page images
 *    -> Uses identical vertical stacking logic
 */

import { Node } from "@xyflow/react";
import { validateImageBytes } from "@/lib/file-validator";

export interface DocumentImportOptions {
  startX?: number;
  startY?: number;
  targetWidth?: number;
  onProgress?: (current: number, total: number, message: string) => void;
}

export interface DocumentImportResult {
  nodes: Node<any>[];
  pageCount: number;
  fileName: string;
}

/**
 * Loads and initializes the pdfjs-dist library on the client
 */
async function getPdfJs() {
  if (typeof window === "undefined") {
    throw new Error("pdfjs-dist can only be loaded in a browser environment");
  }

  const pdfjs = await import("pdfjs-dist");

  // Configure worker source to match current pdfjs-dist version
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }

  return pdfjs;
}

/**
 * Converts an image file to Base64 data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Calculates natural dimensions of a Base64 image
 */
function getImageDimensions(
  base64Src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 850, height: img.naturalHeight || 600 });
    };
    img.onerror = () => {
      resolve({ width: 850, height: 600 });
    };
    img.src = base64Src;
  });
}

/**
 * Renders raw PDF bytes (Uint8Array / ArrayBuffer) into React Flow nodes for EVERY SINGLE PAGE.
 * Dynamic vertical stacking formula: y: startY + (index * (pageHeight + 100))
 */
export async function renderPdfBytesToNodes(
  pdfData: Uint8Array | ArrayBuffer,
  fileName: string,
  options: DocumentImportOptions = {}
): Promise<DocumentImportResult> {
  const {
    startX = 100,
    startY = 100,
    targetWidth = 850,
    onProgress,
  } = options;

  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData),
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  if (totalPages === 0) {
    throw new Error("The selected PDF document contains 0 pages.");
  }

  const nodes: Node<any>[] = [];
  const timestamp = Date.now();

  // CRITICAL: DO NOT SKIP PAGES. Loop through every single page from 1 to pdf.numPages
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pageIndex = pageNum - 1;

    if (onProgress) {
      onProgress(pageNum, totalPages, `Rendering page ${pageNum} of ${totalPages}…`);
    }

    const page = await pdf.getPage(pageNum);
    // Use scale 1.5 for sharp, high-DPI text & graphics
    const viewport = page.getViewport({ scale: 1.5 });

    // Render page to off-screen canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      throw new Error(`Failed to initialize 2D canvas context for page ${pageNum}`);
    }

    // High quality rendering
    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    } as any).promise;

    const base64Image = canvas.toDataURL("image/png");

    // Dynamic scale to standard whiteboard width while preserving exact aspect ratio
    const displayWidth = targetWidth;
    const aspectRatio = viewport.height / viewport.width;
    const pageHeight = Math.round(displayWidth * aspectRatio);

    // EXACT REQUIRED FORMULA: y: startY + (index * (pageHeight + 100))
    const yPosition = startY + (pageIndex * (pageHeight + 100));

    // Create React Flow node - locked so user annotations/diagrams can be drawn over it
    const pageNode: Node<any> = {
      id: `doc-page-${timestamp}-${pageNum}`,
      type: "documentPageNode",
      position: { x: startX, y: yPosition },
      draggable: false, // Locked to prevent accidental drag
      data: {
        imageUrl: base64Image,
        fileName,
        pageNumber: pageNum,
        totalPages,
        width: displayWidth,
        height: pageHeight,
        isLocked: true,
        fileType: "pdf",
      },
    };

    nodes.push(pageNode);
  }

  return {
    nodes,
    pageCount: totalPages,
    fileName,
  };
}

/**
 * Main Universal Document Importer function
 * Handles:
 * - Images -> Single React Flow Image Node
 * - PDFs -> Multi-page rendering with pdfjs-dist
 * - DOCX / PPTX -> /api/convert-document -> Multi-page Base64 images
 */
export async function importDocumentFile(
  file: File,
  options: DocumentImportOptions = {}
): Promise<DocumentImportResult> {
  const {
    startX = 100,
    startY = 100,
    targetWidth = 850,
    onProgress,
  } = options;

  const fileName = file.name;
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/i.test(fileName);
  const isPdf =
    file.type === "application/pdf" ||
    fileExt === "pdf";
  const isDocxOrPptx =
    ["docx", "doc", "pptx", "ppt", "odt"].includes(fileExt);

  // ── 1. Image File Handling ──
  if (isImage) {
    // 1. File size check (max 15MB for canvas imports)
    const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Image file exceeds the maximum allowed size of 15MB.");
    }

    // 2. Reject SVG or script-bearing files (prevent script execution / XSS)
    if (fileExt === "svg" || file.type.includes("svg")) {
      throw new Error("SVG format is not supported for canvas image import. Please use PNG, JPG, or WebP.");
    }

    // 3. Inspect binary magic bytes to verify content authenticity
    try {
      const headerSlice = file.slice(0, 32);
      const arrayBuf = await headerSlice.arrayBuffer();
      const validation = validateImageBytes(new Uint8Array(arrayBuf), MAX_IMAGE_SIZE);
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid image file header. Corrupted or disguised files are rejected.");
      }
    } catch (verr: any) {
      throw new Error(verr?.message || "Image file verification failed.");
    }

    if (onProgress) onProgress(1, 1, "Converting image to canvas node…");

    const base64 = await fileToBase64(file);
    const dimensions = await getImageDimensions(base64);

    const displayWidth = Math.min(targetWidth, dimensions.width || targetWidth);
    const aspectRatio = dimensions.height / (dimensions.width || 1);
    const pageHeight = Math.round(displayWidth * aspectRatio);

    const imageNode: Node<any> = {
      id: `doc-img-${Date.now()}-1`,
      type: "documentPageNode",
      position: { x: startX, y: startY },
      draggable: false, // Locked by default
      data: {
        imageUrl: base64,
        fileName,
        pageNumber: 1,
        totalPages: 1,
        width: displayWidth,
        height: pageHeight,
        isLocked: true,
        fileType: "image",
      },
    };

    return {
      nodes: [imageNode],
      pageCount: 1,
      fileName,
    };
  }

  // ── 2. PDF File Handling (Client-Side pdfjs-dist) ──
  if (isPdf) {
    if (onProgress) onProgress(0, 1, "Reading PDF document…");
    const arrayBuffer = await file.arrayBuffer();
    return await renderPdfBytesToNodes(arrayBuffer, fileName, options);
  }

  // ── 3. DOCX / PPTX Handling (via /api/convert-document) ──
  if (isDocxOrPptx) {
    if (onProgress) onProgress(0, 1, `Sending ${fileExt.toUpperCase()} to document converter…`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", "images");

    const res = await fetch("/api/convert-document", {
      method: "POST",
      headers: {
        Accept: "application/json, application/pdf",
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Failed to convert ${fileExt.toUpperCase()} document: ${errText || res.statusText}`
      );
    }

    const contentType = res.headers.get("content-type") || "";

    // Case A: Endpoint returned JSON with Base64 page images array
    if (contentType.includes("application/json")) {
      const json = await res.json();

      if (json.pages && Array.isArray(json.pages) && json.pages.length > 0) {
        const pages: string[] = json.pages;
        const totalPages = pages.length;
        const nodes: Node<any>[] = [];
        const timestamp = Date.now();

        for (let i = 0; i < totalPages; i++) {
          const pageNum = i + 1;
          const base64 = pages[i];
          const dims = await getImageDimensions(base64);

          const displayWidth = targetWidth;
          const aspectRatio = dims.height / (dims.width || 1);
          const pageHeight = Math.round(displayWidth * aspectRatio);

          // EXACT REQUIRED FORMULA: y: startY + (index * (pageHeight + 100))
          const yPosition = startY + (i * (pageHeight + 100));

          nodes.push({
            id: `doc-${fileExt}-${timestamp}-${pageNum}`,
            type: "documentPageNode",
            position: { x: startX, y: yPosition },
            draggable: false, // Locked
            data: {
              imageUrl: base64,
              fileName,
              pageNumber: pageNum,
              totalPages,
              width: displayWidth,
              height: pageHeight,
              isLocked: true,
              fileType: fileExt,
            },
          });
        }

        return {
          nodes,
          pageCount: totalPages,
          fileName,
        };
      }

      // If JSON returned base64 PDF bytes
      if (json.pdfBase64) {
        const binaryString = atob(json.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await renderPdfBytesToNodes(bytes, fileName, options);
      }
    }

    // Case B: Endpoint returned converted PDF binary / blob directly
    const pdfBytes = await res.arrayBuffer();
    return await renderPdfBytesToNodes(pdfBytes, fileName, options);
  }

  throw new Error(
    `Unsupported file format: .${fileExt}. Please import .pdf, .docx, .pptx, or an image.`
  );
}

export default importDocumentFile;
