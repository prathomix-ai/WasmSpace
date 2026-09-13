// ─────────────────────────────────────────────────────────────────────────────
// MasmSpace — PDF & Document Importer Utility
// Renders PDF pages into images in-browser via PDF.js WebAssembly / Canvas
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
 * Loads the PDF.js library script dynamically
 */
function loadPdfJsScript(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF importing is only supported in browser"));
  }

  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (window.pdfjsLoadingPromise) {
    return window.pdfjsLoadingPromise;
  }

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
    script.onerror = () => reject(new Error("Could not load PDF.js from CDN"));
    document.head.appendChild(script);
  });

  return window.pdfjsLoadingPromise;
}

/**
 * Converts a PDF File into an array of high-res image data URLs (one per page)
 */
export async function renderPdfFileToImages(
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
    // Scale 1.5 gives crisp annotations on retina displays without excessive memory
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background for transparent PDF pages
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/png");

    renderedPages.push({
      pageNumber: pageNum,
      // Target display size on whiteboard in canvas units
      width: Math.round(viewport.width * 0.75),
      height: Math.round(viewport.height * 0.75),
      dataUrl,
    });
  }

  return renderedPages;
}
