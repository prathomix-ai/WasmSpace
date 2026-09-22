// ─────────────────────────────────────────────────────────────────────────────
// Prathomix — PDF & Document Importer Utility
// Renders PDF pages into high-resolution images in-browser via PDF.js WebWorker & HTML5 Canvas
// ─────────────────────────────────────────────────────────────────────────────

export interface RenderedPdfPage {
  pageNumber: number;
  width: number;
  height: number;
  dataUrl: string;
}

declare global {
  interface Window {
    pdfjsLib?: any;
    pdfjsLoadingPromise?: Promise<any>;
  }
}

const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/**
 * Loads the PDF.js library dynamically in the browser
 */
async function loadPdfJsScript(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("PDF importing is only supported in browser environments.");
  }

  // 1. Check if pdfjs-dist was installed and loaded via window
  if (window.pdfjsLib) {
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
    }
    return window.pdfjsLib;
  }

  // 2. Reuse loading promise if already in-flight
  if (window.pdfjsLoadingPromise) {
    return window.pdfjsLoadingPromise;
  }

  // 3. Fallback to resilient CDN loading
  window.pdfjsLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDFJS_CDN}"]`);
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error("pdfjsLib not found on window"));
        }
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load PDF.js script")));
      return;
    }

    const script = document.createElement("script");
    script.src = PDFJS_CDN;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("pdfjsLib not defined after script load"));
      }
    };
    script.onerror = () => reject(new Error("Could not load PDF.js library"));
    document.head.appendChild(script);
  });

  return window.pdfjsLoadingPromise;
}

/**
 * Reads an uploaded PDF File and renders each page to a high-resolution base64 data URL
 *
 * @param file - The PDF File object from input[type=file]
 * @param onProgress - Optional callback receiving (currentPage, totalPages)
 * @returns Promise resolving to an array of RenderedPdfPage objects
 */
export async function extractPdfPagesToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPdfPage[]> {
  const pdfjs = await loadPdfJsScript();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const renderedPages: RenderedPdfPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages);

    const page = await pdfDoc.getPage(pageNum);
    // Scale 2.0 provides ultra-crisp, high-definition text rendering when zooming in the canvas
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill pure white background so transparent PDF pages render cleanly
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/png");

    renderedPages.push({
      pageNumber: pageNum,
      // Target display size on canvas (normalized to ~1x coordinates)
      width: Math.round(viewport.width / 2.0),
      height: Math.round(viewport.height / 2.0),
      dataUrl,
    });
  }

  return renderedPages;
}

// Backward compatibility alias
export const renderPdfFileToImages = extractPdfPagesToImages;
