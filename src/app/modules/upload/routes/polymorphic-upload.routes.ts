import { UserRole } from "@prisma/client";
import { Router } from "express";
import { fileUploader } from "../../../../lib/utils/file-uploader";
import { authGuard } from "../../../middleware/auth";
import sanitizeInputData from "../../../middleware/sanitizeClientDataViaZod";
import { uploadController } from "../controller/upload.controller";
import { uploadValidation } from "../validation/upload.validation";

const router = Router();

/**
 * Upload single file (image, pdf, document, excel)
 * POST /api/upload/single
 * Protected: Any authenticated user can upload
 */
router.post(
  "/single",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.COUNSELOR,
    UserRole.COUNSELOR_HEAD,
    UserRole.APPLICATION_HEAD,
    UserRole.APPLICATION_PROCESSOR,
    UserRole.RECEPTIONIST,
  ),
  fileUploader.uploadSingle,
  uploadController.uploadSingle,
);

/**
 * Upload video file
 * POST /api/upload/video
 * Protected: Any authenticated user can upload
 */
router.post(
  "/video",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.COUNSELOR,
    UserRole.COUNSELOR_HEAD,
    UserRole.RECEPTIONIST,
  ),
  fileUploader.uploadSingle, // Use the same upload single for videos
  uploadController.uploadVideo,
);

/**
 * Upload multiple files
 * POST /api/upload/bulk
 * Protected: Any authenticated user can upload
 */
router.post(
  "/bulk",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.COUNSELOR,
    UserRole.COUNSELOR_HEAD,
    UserRole.APPLICATION_HEAD,
    UserRole.APPLICATION_PROCESSOR,
    UserRole.RECEPTIONIST,
  ),
  fileUploader.upload.array("files", 10), // Accept up to 10 files
  uploadController.uploadBulk,
);

/**
 * Link file to entity (User, Lead, Note, Country)
 * POST /api/upload/link
 * Protected: Any authenticated user
 */
router.post(
  "/link",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.COUNSELOR,
    UserRole.COUNSELOR_HEAD,
    UserRole.APPLICATION_HEAD,
    UserRole.APPLICATION_PROCESSOR,
    UserRole.RECEPTIONIST,
  ),
  sanitizeInputData(uploadValidation.linkFileToEntity),
  uploadController.linkFileToEntity,
);

/**
 * Get unused files (for admin trash page)
 * GET /api/upload/unused
 * Protected: Admin only
 */
router.get(
  "/unused",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTIONIST,
  ),
  uploadController.getUnusedFiles,
);

/**
 * Get deleted files (in trash)
 * GET /api/upload/trash
 * Protected: Admin only
 */
router.get(
  "/trash",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTIONIST,
  ),
  uploadController.getDeletedFiles,
);

/**
 * Soft delete a file (move to trash)
 * DELETE /api/upload/soft/:id
 * Protected: Admin only
 */
router.delete(
  "/soft/:id",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTIONIST,
  ),
  uploadController.softDeleteFile,
);

/**
 * Recover a soft deleted file
 * PUT /api/upload/recover/:id
 * Protected: Admin only
 */
router.put(
  "/recover/:id",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTIONIST,
  ),
  uploadController.recoverFile,
);

/**
 * Permanently delete a file (from DB and Digital Ocean)
 * DELETE /api/upload/permanent/:id
 * Protected: Super Admin only
 */
router.delete(
  "/permanent/:id",
  authGuard(UserRole.SUPER_ADMIN),
  uploadController.permanentDeleteFile,
);

/**
 * Bulk delete files
 * POST /api/upload/bulk-delete
 * Protected: Admin only
 */
router.post(
  "/bulk-delete",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.RECEPTIONIST,
  ),
  sanitizeInputData(uploadValidation.bulkDelete),
  uploadController.bulkDelete,
);

/**
 * Get file by ID
 * GET /api/upload/:id
 * Protected: Any authenticated user
 */
router.get(
  "/:id",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.COUNSELOR,
    UserRole.COUNSELOR_HEAD,
    UserRole.APPLICATION_HEAD,
    UserRole.APPLICATION_PROCESSOR,
    UserRole.RECEPTIONIST,
  ),
  uploadController.getFileById,
);

/**
 * Get files by entity
 * GET /api/upload/entity/:entityType/:entityId
 * Protected: Any authenticated user
 */
router.get(
  "/entity/:entityType/:entityId",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.COUNSELOR,
    UserRole.COUNSELOR_HEAD,
    UserRole.APPLICATION_HEAD,
    UserRole.APPLICATION_PROCESSOR,
    UserRole.RECEPTIONIST,
  ),
  uploadController.getFilesByEntity,
);

export const polymorphicUploadRoutes = router;
