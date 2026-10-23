import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Unicode-aware slug generation
 * Replaces non-alphanumeric chars with hyphens while preserving Urdu/Hindi characters and Latin scripts.
 */
export function generateSlug(text: string): string {
  if (!text) return "post";
  return text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    // Replace non-letters, non-marks (matras), non-numbers with hyphens
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "item";
}

/**
 * Safe filename sanitization:
 * - Strips directory traversal (.. and / and \)
 * - Replaces unsafe characters
 * - Keeps extension
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "file";
  // Remove path separators
  const clean = filename.replace(/^.*[\\/]/, "");
  // Remove control characters and reserved characters: < > : " / \ | ? *
  const sanitized = clean.replace(/[\x00-\x1f\x80-\x9f<>:"/\\|?*]/g, "_").trim();
  return sanitized.slice(0, 150) || "file";
}

export const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp",
  "pdf",
  "doc", "docx",
  "xls", "xlsx",
  "ppt", "pptx",
  "mp4"
];

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4"
];

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB per file
export const MAX_FILES_PER_POST = 20;

export function validateFileMeta(fileName: string, mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds maximum allowed size of 100MB (${formatBytes(sizeBytes)})` };
  }
  if (sizeBytes <= 0) {
    return { valid: false, error: "File cannot be empty" };
  }

  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File extension .${ext} is not allowed` };
  }

  // Permissive check for MIME types since browsers may report generic application/octet-stream
  if (mimeType && mimeType !== "application/octet-stream" && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    // If extension is known valid, we allow it with fallback MIME
    const fallbackMime = getMimeFromExtension(ext);
    if (!fallbackMime) {
      return { valid: false, error: `MIME type ${mimeType} is not supported` };
    }
  }

  return { valid: true };
}

export function getMimeFromExtension(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mp4: "video/mp4"
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}
