import { FileStatus, FileType } from "@prisma/client";

export interface I_UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface I_CreateFilePayload {
  url: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileType: FileType;
  uploadedById: string;
}

export interface I_LinkFileToEntity {
  fileId: string;
  entityId: string;
  entityType: "USER" | "LEAD" | "NOTE" | "COUNTRY";
  fileType?: string; // Optional metadata like 'profile_picture', 'passport', etc.
}

export interface I_FileWithRelations {
  id: string;
  url: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileType: FileType;
  isUsed: boolean;
  status: FileStatus;
  deletedAt: Date | null;
  uploadedBy: {
    id: string;
    email: string;
    profile: {
      fullName: string;
    } | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface I_UnusedFilesQuery {
  page?: number;
  limit?: number;
  fileType?: FileType;
  daysUnused?: number; // Files unused for X days
}

export interface I_BulkDeletePayload {
  fileIds: string[];
  permanent?: boolean; // If true, delete from Digital Ocean too
}
