import { FileType } from "@prisma/client";
import z from "zod";

// Validation schema for file link to entity
export const linkFileToEntitySchema = z.object({
  body: z.object({
    fileId: z.string().min(1, "File ID is required"),
    entityId: z.string().min(1, "Entity ID is required"),
    entityType: z.enum(["USER", "LEAD", "NOTE", "COUNTRY"], {
      errorMap: () => ({
        message: "Entity type must be one of: USER, LEAD, NOTE, COUNTRY",
      }),
    }),
    fileType: z.string().optional(), // e.g., 'profile_picture', 'passport', etc.
  }),
});

// Validation schema for bulk delete
export const bulkDeleteSchema = z.object({
  body: z.object({
    fileIds: z.array(z.string()).min(1, "At least one file ID is required"),
    permanent: z.boolean().optional().default(false),
  }),
});

// Validation schema for get unused files query
export const getUnusedFilesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
    fileType: z.nativeEnum(FileType).optional(),
    daysUnused: z.string().optional().transform(Number),
  }),
});

// Validation schema for getting files by entity
export const getFilesByEntitySchema = z.object({
  query: z.object({
    entityType: z.enum(["USER", "LEAD"]),
    entityId: z.string().min(1, "Entity ID is required"),
  }),
});

export const uploadValidation = {
  linkFileToEntity: linkFileToEntitySchema,
  bulkDelete: bulkDeleteSchema,
  getUnusedFiles: getUnusedFilesSchema,
  getFilesByEntity: getFilesByEntitySchema,
};
