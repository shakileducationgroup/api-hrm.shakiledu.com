import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs/promises";

import { HttpStatusCode } from "axios";
import { T_ASSETS_UPLOAD_FOLDER_NAME } from "../../app/constant";
import AppError from "../../app/errors/appError";
import { s3Client } from "../../app/infrastructure/s3/s3Client";

interface UploadResponse {
  Location: string;
}

export const bucketStorageService = {
  /**
   * Upload a file to DigitalOcean.
   *
   * @param {Express.Multer.File} file The file to upload.
   * @returns {Promise<UploadResponse>} A promise that resolves with an object containing the location of the uploaded file.
   * @throws {Error} If there's an error uploading the file.
   *
   */
  uploadToDigitalOceanAWS: async (
    file: Express.Multer.File,
    folderName = "files" as T_ASSETS_UPLOAD_FOLDER_NAME,
  ): Promise<UploadResponse> => {
    try {
      let fileBuffer: Buffer;

      if (file.buffer) {
        // File is already in memory (from memoryStorage)
        fileBuffer = file.buffer;
      } else if (file.path) {
        // File is on disk (from diskStorage) - read it into buffer
        fileBuffer = await fs.readFile(file.path);
      } else {
        throw new AppError(
          HttpStatusCode.BadRequest,
          "No file buffer or path available",
        );
      }
      const fileExtension = file.originalname?.split(".").pop();
      const timestamp = `${Date.now()}${Math.floor(100000 + Math.random() * 900000)}`;
      const baseName = file.originalname
        ?.split(".")[0]
        ?.replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const fileName = `files/${baseName}-${timestamp}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: `${process.env.DO_SPACE_BUCKET}`,
        Key: fileName,
        Body: fileBuffer,
        ACL: "public-read",
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Digital Ocean Spaces URL format
      const Location = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${fileName}`;

      return { Location };
    } catch (error) {
      console.error(`Error uploading file: ${file.originalname}`, error);
      throw new AppError(
        HttpStatusCode.InternalServerError,
        (error as Error).message,
      );
    }
  },

  /**
   * Upload multiple files to Digital Ocean AWS
   */
  uploadMultipleToDigitalOcean: async (
    files: Express.Multer.File[],
    folderName = "files" as T_ASSETS_UPLOAD_FOLDER_NAME,
  ): Promise<string[]> => {
    try {
      if (!files || files.length === 0) {
        throw new AppError(
          HttpStatusCode.BadRequest,
          "No files provided for upload",
        );
      }

      // Process all uploads concurrently
      const uploadPromises = files.map(async (file) => {
        try {
          let fileBuffer: Buffer;

          if (file.buffer) {
            // File is already in memory (from memoryStorage)
            fileBuffer = file.buffer;
          } else if (file.path) {
            // File is on disk (from diskStorage) - read it into buffer
            fileBuffer = await fs.readFile(file.path);
          } else {
            throw new AppError(
              HttpStatusCode.BadRequest,
              `No file buffer or path available for ${file.originalname}`,
            );
          }

          // Generate unique filename
          const fileExtension = file.originalname?.split(".").pop() || "file";
          const timestamp = `${Date.now()}${Math.floor(100000 + Math.random() * 900000)}`;
          const baseName =
            file.originalname
              ?.split(".")[0]
              ?.replace(/[^a-z0-9]/gi, "_")
              .toLowerCase() || "upload";
          const fileName = `${folderName}/${baseName}-${timestamp}.${fileExtension}`;

          const command = new PutObjectCommand({
            Bucket: `${process.env.DO_SPACE_BUCKET}`,
            Key: fileName,
            Body: fileBuffer,
            ACL: "public-read",
            ContentType: file.mimetype,
          });

          await s3Client.send(command);

          // Digital Ocean Spaces URL format
          return `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${fileName}`;
        } catch (error) {
          console.error(`Error uploading file: ${file.originalname}`, error);
          throw new AppError(
            HttpStatusCode.InternalServerError,
            `Failed to upload ${file.originalname}: ${(error as Error).message}`,
          );
        }
      });

      // Wait for all uploads to complete
      const uploadedUrls = await Promise.all(uploadPromises);

      // Filter out any failed uploads (though they should throw errors)
      return uploadedUrls.filter((url): url is string => url !== null);
    } catch (error) {
      console.error("Error in bulk file upload:", error);

      throw new AppError(
        HttpStatusCode.InternalServerError,
        `Bulk upload failed: ${(error as Error).message}`,
      );
    }
  },

  uploadToDigitalOceanAWSS: async (
    file: Express.Multer.File,
    folderName = "files" as T_ASSETS_UPLOAD_FOLDER_NAME,
  ): Promise<UploadResponse> => {
    try {
      const fileExtension = file.originalname?.split(".").pop();
      const timestamp = `${Date.now()}${Math.floor(100000 + Math.random() * 900000)}`;
      const baseName = file.originalname
        ?.split(".")[0]
        ?.replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const fileName = `${folderName}/${baseName}-${timestamp}.${fileExtension}`;

      // Use Upload for better handling
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: `${process.env.DO_SPACE_BUCKET}`,
          Key: fileName,
          Body: file.buffer,
          ACL: "public-read",
          ContentType: file.mimetype,
        },
      });

      await upload.done();

      // Construct the correct URL format for Digital Ocean Spaces
      const Location = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${fileName}`;

      return { Location };
    } catch (error) {
      console.error(`Error uploading file: ${file.originalname}`, error);
      throw error;
    }
  },

  // Upload buffer files like pdf etc to digital ocean
  uploadBufferToDigitalOcean: async (
    buffer: Buffer | Uint8Array,
    fileName: string,
    contentType = "application/pdf",
  ): Promise<{ Location: string }> => {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.DO_SPACE_BUCKET!,
        Key: fileName,
        Body: buffer,
        ACL: "public-read", // or private if you want signed URLs
        ContentType: contentType,
      });

      await s3Client.send(command);

      const Location = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${fileName}`;
      return { Location };
    } catch (error) {
      console.error(`Error uploading file ${fileName}`, error);
      throw error;
    }
  },

  // Delete from the digital ocean
  deleteFromDigitalOceanAWS: async (
    fileUrl: string,
  ): Promise<DeleteObjectCommandOutput> => {
    try {
      // Extract the file key from the URL
      const key = fileUrl.replace(
        `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/`,
        "",
      );

      // Prepare the delete command
      const command = new DeleteObjectCommand({
        Bucket: `${process.env.DO_SPACE_BUCKET}`,
        Key: key,
      });

      // Execute the delete command
      const response = await s3Client.send(command);
      return response;
    } catch (error) {
      console.error(
        `Error deleting file: ${fileUrl}`,
        (error as Error).message,
      );
      throw new AppError(
        HttpStatusCode.InternalServerError,
        `Failed to delete file: ${(error as Error).message}`,
      );
    }
  },
};
