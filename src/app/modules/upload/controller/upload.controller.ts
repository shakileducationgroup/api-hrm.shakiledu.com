import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import asyncHandler from "../../../../lib/utils/async-handler";
import sendResponse from "../../../../lib/utils/sendResponse";
import { I_GlobalJwtPayload } from "../../../interface/common.interface";
import { linkFileToTableService } from "../service/link-file.service";
import { uploadService } from "../service/upload.service";
import {
  I_BulkDeletePayload,
  I_LinkFileToEntity,
  I_UnusedFilesQuery,
} from "../types/upload.types";

class UploadController {
  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File;
    const folder = req.body.folder || "uploads";

    if (!file) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.BadRequest,
        success: false,
        message: "No file provided",
      });
    }

    const uploadedFile = await uploadService.uploadToStorage(file, folder);

    sendResponse(res, {
      statusCode: HttpStatusCode.Created,
      success: true,
      message: "File uploaded successfully",
      data: {
        url: uploadedFile,
      },
    });
  });

  /**
   * Upload single file
   * POST /api/upload/single
   */
  uploadSingle = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File;
    const userId = req.user?.id;
    const folder = req.body.folder || "uploads";

    if (!file) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.BadRequest,
        success: false,
        message: "No file provided",
      });
    }

    if (!userId) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.Forbidden,
        success: false,
        message: "Unauthorized",
      });
    }

    const uploadedFile = await uploadService.uploadFile(
      file as any,
      userId,
      folder,
    );

    sendResponse(res, {
      statusCode: HttpStatusCode.Created,
      success: true,
      message: "File uploaded successfully",
      data: uploadedFile,
    });
  });

  /**
   * Upload video (with larger size limit)
   * POST /api/upload/video
   */
  uploadVideo = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const userId = req.user?.id;
    const folder = req.body.folder || "videos";

    if (!file) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.BadRequest,
        success: false,
        message: "No video file provided",
      });
    }

    if (!userId) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.Forbidden,
        success: false,
        message: "Unauthorized",
      });
    }

    const uploadedFile = await uploadService.uploadFile(
      file as any,
      userId,
      folder,
    );

    sendResponse(res, {
      statusCode: HttpStatusCode.Created,
      success: true,
      message: "Video uploaded successfully",
      data: uploadedFile,
    });
  });

  /**
   * Upload multiple files
   * POST /api/upload/bulk
   */
  uploadBulk = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id;
    const folder = req.body.folder || "uploads";

    if (!files || files.length === 0) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.BadRequest,
        success: false,
        message: "No files provided",
      });
    }

    if (!userId) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.Forbidden,
        success: false,
        message: "Unauthorized",
      });
    }

    const uploadedFiles = await uploadService.uploadBulkFiles(
      files as any,
      userId,
      folder,
    );

    sendResponse(res, {
      statusCode: HttpStatusCode.Created,
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: uploadedFiles,
    });
  });

  /**
   * Link file to entity
   * POST /api/upload/link
   */
  linkFileToEntity = asyncHandler(async (req: Request, res: Response) => {
    const payload: I_LinkFileToEntity = req.body;

    const result = await linkFileToTableService.linkFileToEntity(payload);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "File linked to entity successfully",
      data: result,
    });
  });

  /**
   * Get unused files (for admin trash page)
   * GET /api/upload/unused
   */
  getUnusedFiles = asyncHandler(async (req: Request, res: Response) => {
    const query: I_UnusedFilesQuery = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      fileType: req.query.fileType as any,
      daysUnused: req.query.daysUnused
        ? Number(req.query.daysUnused)
        : undefined,
    };

    const result = await uploadService.getUnusedFiles(query);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Unused files retrieved successfully",
      data: {
        files: result.files,
        pagination: result.pagination,
      },
    });
  });

  /**
   * Get deleted files (in trash)
   * GET /api/upload/trash
   */
  getDeletedFiles = asyncHandler(async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const result = await uploadService.getDeletedFiles(page, limit);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Deleted files retrieved successfully",
      data: {
        files: result.files,
        pagination: result.pagination,
      },
    });
  });

  /**
   * Soft delete a file
   * DELETE /api/upload/soft/:id
   */
  softDeleteFile = asyncHandler(async (req: Request, res: Response) => {
    const fileId = req.params.id as string;
    const userId = (req.user as I_GlobalJwtPayload).id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.Forbidden,
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await uploadService.softDeleteFile(fileId, userId);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "File moved to trash successfully",
      data: result,
    });
  });

  /**
   * Recover a soft deleted file
   * PUT /api/upload/recover/:id
   */
  recoverFile = asyncHandler(async (req: Request, res: Response) => {
    const fileId = req.params.id as string;

    const result = await uploadService.recoverFile(fileId);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "File recovered successfully",
      data: result,
    });
  });

  /**
   * Permanently delete a file
   * DELETE /api/upload/permanent/:id
   */
  permanentDeleteFile = asyncHandler(async (req: Request, res: Response) => {
    const fileId = req.params.id as string;

    const result = await uploadService.permanentDeleteFile(fileId);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: result.message,
    });
  });

  /**
   * Bulk delete files
   * POST /api/upload/bulk-delete
   */
  bulkDelete = asyncHandler(async (req: Request, res: Response) => {
    const payload: I_BulkDeletePayload = req.body;
    const userId = (req.user as I_GlobalJwtPayload).id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: HttpStatusCode.Forbidden,
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await uploadService.bulkDeleteFiles(payload, userId);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: result.message,
    });
  });

  /**
   * Get file by ID
   * GET /api/upload/:id
   */
  getFileById = asyncHandler(async (req: Request, res: Response) => {
    const fileId = req.params.id as string;

    const file = await uploadService.getFileById(fileId);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "File retrieved successfully",
      data: file,
    });
  });

  /**
   * Get files by entity
   * GET /api/upload/entity/:entityType/:entityId
   */
  getFilesByEntity = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;

    const files = await uploadService.getFilesByEntity(
      entityType as "USER" | "LEAD",
      entityId as string,
    );

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Files retrieved successfully",
      data: files,
    });
  });
}

export const uploadController = new UploadController();
