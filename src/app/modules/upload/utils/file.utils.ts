import { FileType } from "@prisma/client";

/**
 * Determine file type based on MIME type
 */
export function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) {
    return FileType.IMAGE;
  }
  if (mimeType === "application/pdf") {
    return FileType.PDF;
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return FileType.EXCEL;
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    mimeType === "text/plain"
  ) {
    return FileType.DOCUMENT;
  }
  if (mimeType.startsWith("video/")) {
    return FileType.VIDEO;
  }
  return FileType.DOCUMENT; // Default fallback
}

/**
 * Validate file size based on file type
 */
export function validateFileSize(
  fileSize: number,
  fileType: FileType
): boolean {
  const MAX_SIZES = {
    [FileType.IMAGE]: 10 * 1024 * 1024, // 10MB
    [FileType.PDF]: 20 * 1024 * 1024, // 20MB
    [FileType.DOCUMENT]: 20 * 1024 * 1024, // 20MB
    [FileType.EXCEL]: 20 * 1024 * 1024, // 20MB
    [FileType.VIDEO]: 500 * 1024 * 1024, // 500MB
  };

  return fileSize <= MAX_SIZES[fileType];
}

/**
 * Allowed MIME types for upload
 */
export const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  PDF: ["application/pdf"],
  DOCUMENT: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
    "text/plain", // .txt
  ],
  EXCEL: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
  ],
  VIDEO: [
    "video/mp4",
    "video/mpeg",
    "video/quicktime", // .mov
    "video/x-msvideo", // .avi
    "video/webm",
  ],
};

/**
 * Check if MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return Object.values(ALLOWED_MIME_TYPES).flat().includes(mimeType);
}

/**
 * Generate unique filename for storage
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop();
  const baseName = originalName
    .split(".")
    .slice(0, -1)
    .join(".")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();

  return `${baseName}-${timestamp}-${randomStr}.${ext}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}
