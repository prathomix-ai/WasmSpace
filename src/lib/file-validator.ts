/**
 * Deep File Upload Validation & Security Module
 *
 * Validates:
 * 1. File size (configurable via MAX_UPLOAD_SIZE_MB, default 20MB).
 * 2. File extensions and MIME types.
 * 3. Binary Magic Byte signatures (content inspection, not just filename).
 * 4. Rejection of executable binaries (Windows PE/MZ, Linux ELF, Mach-O, scripts).
 * 5. Filename sanitization against path traversal (directory climbing ../, null bytes).
 */

export const MAX_UPLOAD_SIZE_BYTES =
  (Number(process.env.MAX_UPLOAD_SIZE_MB) || 20) * 1024 * 1024;

export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "odt",
  "txt",
] as const;

export type SupportedDocumentExtension =
  (typeof SUPPORTED_DOCUMENT_EXTENSIONS)[number];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedFormat?: SupportedDocumentExtension;
  sanitizedFileName: string;
}

/**
 * Sanitizes a filename to ensure it cannot contain directory traversal characters,
 * null bytes, or dangerous shell characters.
 */
export function sanitizeFileName(rawFileName: string): string {
  if (!rawFileName || typeof rawFileName !== "string") {
    return `document_${Date.now()}.pdf`;
  }

  // Strip null bytes and control characters
  let clean = rawFileName.replace(/[\x00-\x1f\x7f]/g, "");

  // Strip path traversal (../, ..\, absolute slashes)
  clean = clean.replace(/^.*[\\\/]/, "");
  clean = clean.replace(/\.\.+/g, ".");

  // Keep only alphanumeric, dots, dashes, underscores, and spaces
  clean = clean.replace(/[^a-zA-Z0-9._\- ]/g, "_").trim();

  if (!clean || clean === ".") {
    return `document_${Date.now()}.pdf`;
  }

  // Enforce max filename length
  if (clean.length > 120) {
    const ext = clean.split(".").pop() || "";
    clean = `${clean.substring(0, 110)}.${ext}`;
  }

  return clean;
}

/**
 * Validates file buffer magic bytes against dangerous executable formats.
 */
function isExecutableOrDangerous(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // 1. Windows PE / DOS MZ header ('MZ')
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return true;
  }

  // 2. Linux ELF binary (0x7F 'E' 'L' 'F')
  if (
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    return true;
  }

  // 3. Java class file (0xCA 0xFE 0xBA 0xBE)
  if (
    buffer[0] === 0xca &&
    buffer[1] === 0xfe &&
    buffer[2] === 0xba &&
    buffer[3] === 0xbe
  ) {
    return true;
  }

  // 4. Mach-O (macOS binaries)
  const isMachO =
    (buffer[0] === 0xfe && buffer[1] === 0xed && buffer[2] === 0xfa && (buffer[3] === 0xce || buffer[3] === 0xcf)) ||
    (buffer[0] === 0xce && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe) ||
    (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe);
  if (isMachO) return true;

  // 5. Shell script shebang (#!/...)
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return true;
  }

  return false;
}

/**
 * Validates actual binary file content header matches expected document format.
 */
function verifyMagicBytes(
  buffer: Buffer,
  extension: string
): { matches: boolean; detected?: SupportedDocumentExtension } {
  if (buffer.length < 4) {
    return { matches: false };
  }

  // PDF check: Starts with '%PDF-' (0x25 0x50 0x44 0x46)
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  if (isPdf) {
    return { matches: extension === "pdf" || extension === "unknown", detected: "pdf" };
  }

  // ZIP-based document formats (DOCX, PPTX, ODT): Starts with 'PK\x03\x04' (0x50 0x4B 0x03 0x04)
  const isZip =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  if (isZip) {
    const validZipExt = ["docx", "pptx", "odt"].includes(extension);
    return {
      matches: validZipExt,
      detected: (["docx", "pptx", "odt"].includes(extension)
        ? extension
        : "docx") as SupportedDocumentExtension,
    };
  }

  // OLE compound document (legacy DOC, PPT): 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
  const isOle =
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;

  if (isOle) {
    const validOleExt = ["doc", "ppt"].includes(extension);
    return {
      matches: validOleExt,
      detected: (extension === "ppt" ? "ppt" : "doc") as SupportedDocumentExtension,
    };
  }

  // Plain text (must be printable UTF-8 / ASCII)
  if (extension === "txt") {
    // Check first 512 bytes for non-text control chars (excluding tab, CR, LF)
    const checkLen = Math.min(buffer.length, 512);
    for (let i = 0; i < checkLen; i++) {
      const b = buffer[i];
      if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
        return { matches: false };
      }
    }
    return { matches: true, detected: "txt" };
  }

  return { matches: false };
}

/**
 * Comprehensive document upload validator:
 * Checks size, extension, executable signatures, and magic bytes.
 */
export function validateUploadedDocument(
  buffer: Buffer,
  rawFileName: string,
  fileSize: number
): FileValidationResult {
  const sanitizedFileName = sanitizeFileName(rawFileName);

  // 1. Enforce size limit
  if (fileSize > MAX_UPLOAD_SIZE_BYTES || buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    const maxMb = Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024));
    return {
      valid: false,
      sanitizedFileName,
      error: `File exceeds the maximum allowed size limit of ${maxMb}MB.`,
    };
  }

  if (fileSize === 0 || buffer.length === 0) {
    return {
      valid: false,
      sanitizedFileName,
      error: "The uploaded file is empty.",
    };
  }

  // 2. Reject executable / binary code
  if (isExecutableOrDangerous(buffer)) {
    return {
      valid: false,
      sanitizedFileName,
      error: "Executable or binary script files are strictly prohibited.",
    };
  }

  // 3. Check file extension
  const extension = (sanitizedFileName.split(".").pop() || "").toLowerCase();
  if (
    !SUPPORTED_DOCUMENT_EXTENSIONS.includes(
      extension as SupportedDocumentExtension
    )
  ) {
    return {
      valid: false,
      sanitizedFileName,
      error: `Unsupported document format (.${extension}). Supported formats: .pdf, .docx, .pptx, .doc, .ppt, .odt, .txt.`,
    };
  }

  // 4. Verify binary magic bytes
  const magicCheck = verifyMagicBytes(buffer, extension);
  if (!magicCheck.matches) {
    return {
      valid: false,
      sanitizedFileName,
      error: `File content does not match declared .${extension} format. Spoofed or corrupted files are rejected.`,
    };
  }

  return {
    valid: true,
    detectedFormat: magicCheck.detected || (extension as SupportedDocumentExtension),
    sanitizedFileName,
  };
}

/**
 * Validates binary image bytes (PNG, JPEG, WebP, GIF) from a Uint8Array or Buffer.
 * Blocks SVGs, HTML, and binary executable signatures.
 */
export function validateImageBytes(
  bytes: Uint8Array | number[],
  maxSizeBytes = 5 * 1024 * 1024
): { valid: boolean; format?: "png" | "jpeg" | "webp" | "gif"; error?: string } {
  if (!bytes || bytes.length < 8) {
    return { valid: false, error: "Invalid or empty image file." };
  }

  if (bytes.length > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `Image exceeds the maximum allowed size of ${maxMb}MB.` };
  }

  // 1. Executable check (MZ, ELF, Mach-O, Java class, Shebang)
  if (
    (bytes[0] === 0x4d && bytes[1] === 0x5a) || // MZ
    (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) || // ELF
    (bytes[0] === 0xca && bytes[1] === 0xfe && bytes[2] === 0xba && bytes[3] === 0xbe) || // Class
    (bytes[0] === 0x23 && bytes[1] === 0x21) // #!
  ) {
    return { valid: false, error: "Dangerous or executable file rejected." };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, format: "png" };
  }

  // 3. JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, format: "jpeg" };
  }

  // 4. WebP: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, format: "webp" };
  }

  // 5. GIF: GIF87a or GIF89a (0x47 0x49 0x46 0x38 0x37/0x39 0x61)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { valid: true, format: "gif" };
  }

  return {
    valid: false,
    error: "Invalid image format. Only PNG, JPEG, WebP, and GIF files with valid binary signatures are supported.",
  };
}
