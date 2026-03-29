import fs from "fs";
import path from "path";

/**
 * Deletes a file by its full URL (e.g., "http://example.com/uploads/<sub_folder>/20250515-Screenshot.png")
 * @param fileUrl - The full URL of the file to delete
 */

export const deleteFileByUrl = (fileUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Extract the relative path from URL
      const url = new URL(fileUrl);
      const relativePath = url.pathname.replace(/^\/uploads\//, ""); // Remove "/uploads/" prefix

      const fullPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        relativePath,
      );

      fs.unlink(fullPath, (err) => {
        if (err) {
          // Ignore "file not found" errors
          if (err.code === "ENOENT") {
            console.warn(`File not found: ${fullPath}`);
            return resolve();
          }
          reject(new Error(`Failed to delete file: ${err.message}`));
        } else {
          console.log(`🗑️ File deleted successful: ${fullPath}`);
          resolve();
        }
      });
    } catch (err: any) {
      reject(new Error(`Invalid URL format: ${err.message}`));
    }
  });
};
