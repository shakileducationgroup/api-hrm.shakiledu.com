import { PutObjectCommand } from "@aws-sdk/client-s3";
import { HttpStatusCode } from "axios";
import env from "../../app/config/clean-env";
import AppError from "../../app/errors/appError";
import { s3Client } from "../../app/infrastructure/s3/s3Client";

interface AudioUploadResponse {
  Location: string;
  fileName: string;
}

/**
 * Audio file uploader for DigitalOcean Spaces
 * Used for Twilio call recordings and other audio files
 */
export const audioUploadService = {
  /**
   * Upload audio buffer to DigitalOcean Spaces
   *
   * @param {Buffer} audioBuffer The audio file buffer
   * @param {string} fileName Original filename (will be sanitized)
   * @param {string} folderPath Folder path in the space (e.g., 'recordings', 'voicemails')
   * @returns {Promise<AudioUploadResponse>} Location URL and filename
   */
  uploadAudio: async (
    audioBuffer: Buffer,
    fileName: string,
    folderPath: string = "recordings",
  ): Promise<AudioUploadResponse> => {
    try {
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new AppError(
          HttpStatusCode.BadRequest,
          "No audio buffer provided",
        );
      }

      // Sanitize filename
      const sanitizedName = fileName
        .replace(/[^a-z0-9.-]/gi, "_")
        .toLowerCase();

      // Generate unique key
      const timestamp = Date.now();
      const uniqueFileName = `${folderPath}/${timestamp}-${sanitizedName}`;

      const command = new PutObjectCommand({
        Bucket: env.DO_SPACE_BUCKET,
        Key: uniqueFileName,
        Body: audioBuffer,
        ACL: "public-read",
        ContentType: "audio/mpeg",
        Metadata: {
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // Build the public URL using CDN endpoint
      const Location = `${env.DO_SPACE_CDN_ENDPOINT}/${uniqueFileName}`;

      console.log(`✅ Audio uploaded to Spaces: ${Location}`);

      return {
        Location,
        fileName: uniqueFileName,
      };
    } catch (error) {
      console.error(`❌ Error uploading audio: ${fileName}`, error);
      throw new AppError(
        HttpStatusCode.InternalServerError,
        `Failed to upload audio: ${(error as Error).message}`,
      );
    }
  },

  /**
   * Delete audio file from DigitalOcean Spaces
   *
   * @param {string} fileKey The file key/path in the space
   */
  deleteAudio: async (fileKey: string): Promise<void> => {
    try {
      if (!fileKey) {
        throw new AppError(
          HttpStatusCode.BadRequest,
          "No file key provided for deletion",
        );
      }

      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

      const command = new DeleteObjectCommand({
        Bucket: env.DO_SPACE_BUCKET,
        Key: fileKey,
      });

      await s3Client.send(command);

      console.log(`🗑️ Audio deleted from Spaces: ${fileKey}`);
    } catch (error) {
      console.error(`❌ Error deleting audio: ${fileKey}`, error);
      throw new AppError(
        HttpStatusCode.InternalServerError,
        `Failed to delete audio: ${(error as Error).message}`,
      );
    }
  },

  /**
   * Extract file key from CDN URL
   * Converts: https://cdn-url/recordings/timestamp-filename.mp3 -> recordings/timestamp-filename.mp3
   */
  extractFileKeyFromUrl: (cdnUrl: string): string => {
    try {
      // Get the part after the CDN endpoint
      const baseUrl = env.DO_SPACE_CDN_ENDPOINT;
      if (!baseUrl) {
        throw new Error("DO_SPACE_CDN_ENDPOINT not configured");
      }

      const fileKey = cdnUrl.replace(`${baseUrl}/`, "");
      return fileKey;
    } catch (error) {
      console.error(`❌ Error extracting file key from URL: ${cdnUrl}`, error);
      throw new AppError(
        HttpStatusCode.InternalServerError,
        "Failed to extract file key from URL",
      );
    }
  },
};
