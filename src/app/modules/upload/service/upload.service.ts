import { HttpStatusCode } from "axios";
import { bucketStorageService } from "../../../../lib/utils/upload-digital-ocean";
import AppError from "../../../errors/appError";
import { uploadRepository } from "../repository/upload.repository";
import {
  I_BulkDeletePayload,
  I_UnusedFilesQuery,
  I_UploadedFile,
} from "../types/upload.types";
import {
  generateUniqueFileName,
  getFileTypeFromMime,
  isAllowedMimeType,
  validateFileSize,
} from "../utils/file.utils";
import { linkFileToTableService } from "./link-file.service";

/**
 * Helper function to upload file to Digital Ocean
 */
async function uploadFileToDigitalOcean(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const result = await bucketStorageService.uploadBufferToDigitalOcean(
    buffer,
    fileName,
    mimeType
  );
  return result.Location;
}

/**
 * Helper function to delete file from Digital Ocean
 */
async function deleteFileFromDigitalOcean(url: string): Promise<void> {
  await bucketStorageService.deleteFromDigitalOceanAWS(url);
}

class UploadService {
  /**
   * Upload a single file
   */
  async uploadToStorage(file: I_UploadedFile, folder: string = "uploads") {
    // Validate MIME type
    if (!isAllowedMimeType(file.mimetype)) {
      throw new AppError(
        HttpStatusCode.BadRequest,
        `File type ${file.mimetype} is not allowed`
      );
    }

    // Determine file type
    const fileType = getFileTypeFromMime(file.mimetype);

    // Validate file size
    if (!validateFileSize(file.size, fileType)) {
      throw new AppError(
        HttpStatusCode.BadRequest,
        `File size exceeds the maximum allowed for ${fileType}`
      );
    }

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.originalname);

    const { Location } = await bucketStorageService.uploadBufferToDigitalOcean(
      file.buffer,
      `${folder}/${uniqueFileName}`,
      file.mimetype
    );

    return Location;
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: I_UploadedFile,
    uploadedById: string,
    folder: string = "uploads"
  ) {
    // Validate MIME type
    if (!isAllowedMimeType(file.mimetype)) {
      throw new AppError(
        HttpStatusCode.BadRequest,
        `File type ${file.mimetype} is not allowed`
      );
    }

    // Determine file type
    const fileType = getFileTypeFromMime(file.mimetype);

    // Validate file size
    if (!validateFileSize(file.size, fileType)) {
      throw new AppError(
        HttpStatusCode.BadRequest,
        `File size exceeds the maximum allowed for ${fileType}`
      );
    }

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.originalname);

    // Upload to Digital Ocean
    const url = await uploadFileToDigitalOcean(
      file.buffer,
      `${folder}/${uniqueFileName}`,
      file.mimetype
    );

    // Save to database
    const fileRecord = await uploadRepository.createFile({
      url,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileType,
      uploadedById,
    });

    return fileRecord;
  }

  /**
   * Upload multiple files
   */
  async uploadBulkFiles(
    files: I_UploadedFile[],
    uploadedById: string,
    folder: string = "uploads"
  ) {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, uploadedById, folder)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Replace file for an entity (e.g., user changes profile picture)
   * This will mark the old file as unused and link the new one
   */
  async replaceFileForEntity(
    entityType: "USER" | "LEAD" | "NOTE" | "COUNTRY",
    entityId: string,
    newFile: I_UploadedFile,
    uploadedById: string,
    fileType?: string
  ) {
    // Get current files for the entity
    let currentFiles: any[] = [];
    if (entityType === "USER") {
      currentFiles = await uploadRepository.getFilesByUser(entityId);
      // Filter by fileType if provided
      if (fileType) {
        currentFiles = currentFiles.filter((uf) => uf.fileType === fileType);
      }
    } else if (entityType === "LEAD") {
      currentFiles = await uploadRepository.getFilesByLead(entityId);
      if (fileType) {
        currentFiles = currentFiles.filter((lf) => lf.fileType === fileType);
      }
    }

    // Upload new file
    const newFileRecord = await this.uploadFile(newFile, uploadedById);

    // Link new file to entity
    await linkFileToTableService.linkFileToEntity({
      fileId: newFileRecord.id,
      entityId,
      entityType,
      fileType,
    });

    // Mark old files as unused
    if (currentFiles.length > 0) {
      for (const cf of currentFiles) {
        if (entityType === "USER") {
          await uploadRepository.unlinkFileFromUser(entityId, cf.fileId);
        }
      }
    }

    return newFileRecord;
  }

  /**
   * Get unused files (for admin trash page)
   */
  async getUnusedFiles(query: I_UnusedFilesQuery) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const { files, total } = await uploadRepository.getUnusedFiles({
      skip,
      take: limit,
      fileType: query.fileType,
      daysUnused: query.daysUnused,
    });

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get deleted files (soft deleted, in trash)
   */
  async getDeletedFiles(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const { files, total } = await uploadRepository.getDeletedFiles({
      skip,
      take: limit,
    });

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Soft delete a file
   */
  async softDeleteFile(fileId: string, deletedBy: string) {
    const file = await uploadRepository.getFileById(fileId);
    if (!file) {
      throw new AppError(HttpStatusCode.NotFound, "File not found");
    }

    return uploadRepository.softDeleteFile(fileId, deletedBy);
  }

  /**
   * Recover a soft deleted file
   */
  async recoverFile(fileId: string) {
    const file = await uploadRepository.getFileById(fileId);
    if (!file) {
      throw new AppError(HttpStatusCode.NotFound, "File not found");
    }

    return uploadRepository.recoverFile(fileId);
  }

  /**
   * Permanently delete a file (from DB and Digital Ocean)
   */
  async permanentDeleteFile(fileId: string) {
    const file = await uploadRepository.getFileById(fileId);
    if (!file) {
      throw new AppError(HttpStatusCode.NotFound, "File not found");
    }

    // Delete from Digital Ocean
    await deleteFileFromDigitalOcean(file.url);

    // Delete from database
    await uploadRepository.permanentDeleteFile(fileId);

    return { message: "File permanently deleted" };
  }

  /**
   * Bulk delete files
   */
  async bulkDeleteFiles(payload: I_BulkDeletePayload, deletedBy: string) {
    if (payload.fileIds.length === 0) {
      throw new AppError(HttpStatusCode.BadRequest, "No file IDs provided");
    }

    if (payload.permanent) {
      // Permanently delete (from DB and Digital Ocean)
      const files = await Promise.all(
        payload.fileIds.map((id) => uploadRepository.getFileById(id))
      );

      // Delete from Digital Ocean
      await Promise.all(
        files
          .filter((f) => f !== null)
          .map((f) => deleteFileFromDigitalOcean(f!.url))
      );

      // Delete from database
      await uploadRepository.bulkPermanentDelete(payload.fileIds);
    } else {
      // Soft delete
      await uploadRepository.bulkSoftDelete(payload.fileIds, deletedBy);
    }

    return {
      message: `${payload.fileIds.length} files ${payload.permanent ? "permanently deleted" : "moved to trash"}`,
    };
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string) {
    const file = await uploadRepository.getFileById(fileId);
    if (!file) {
      throw new AppError(HttpStatusCode.NotFound, "File not found");
    }
    return file;
  }

  /**
   * Get files by entity
   */
  async getFilesByEntity(entityType: "USER" | "LEAD", entityId: string) {
    if (entityType === "USER") {
      return uploadRepository.getFilesByUser(entityId);
    } else if (entityType === "LEAD") {
      return uploadRepository.getFilesByLead(entityId);
    }

    throw new AppError(HttpStatusCode.BadRequest, "Invalid entity type");
  }
}

export const uploadService = new UploadService();
