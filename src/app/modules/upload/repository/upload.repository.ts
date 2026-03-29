import { FileStatus, FileType, Prisma } from "@prisma/client";
import prisma from "../../../../lib/utils/prisma.utils";
import { I_CreateFilePayload } from "../types/upload.types";

class UploadRepository {
  /**
   * Create a new file record in database
   */
  async createFile(data: I_CreateFilePayload) {
    return prisma.files.create({
      data: {
        url: data.url,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        fileType: data.fileType,
        uploadedById: data.uploadedById,
        isUsed: false,
        status: FileStatus.ACTIVE,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string) {
    return prisma.files.findUnique({
      where: { id: fileId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update file usage status
   */
  async updateFileUsage(fileId: string, isUsed: boolean) {
    return prisma.files.update({
      where: { id: fileId },
      data: { isUsed },
    });
  }

  /**
   * Soft delete a file
   */
  async softDeleteFile(fileId: string, deletedBy: string) {
    return prisma.files.update({
      where: { id: fileId },
      data: {
        status: FileStatus.DELETED,
        deletedAt: new Date(),
        deletedBy,
        isUsed: false,
      },
    });
  }

  /**
   * Recover a soft deleted file
   */
  async recoverFile(fileId: string) {
    return prisma.files.update({
      where: { id: fileId },
      data: {
        status: FileStatus.ACTIVE,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  /**
   * Permanently delete file from database
   */
  async permanentDeleteFile(fileId: string) {
    return prisma.files.delete({
      where: { id: fileId },
    });
  }

  /**
   * Get unused files (files where isUsed = false)
   */
  async getUnusedFiles(filters: {
    skip?: number;
    take?: number;
    fileType?: FileType;
    daysUnused?: number;
  }) {
    const whereCondition: Prisma.FilesWhereInput = {
      isUsed: false,
      status: FileStatus.ACTIVE,
    };

    if (filters.fileType) {
      whereCondition.fileType = filters.fileType;
    }

    if (filters.daysUnused) {
      const date = new Date();
      date.setDate(date.getDate() - filters.daysUnused);
      whereCondition.createdAt = {
        lte: date,
      };
    }

    const [files, total] = await Promise.all([
      prisma.files.findMany({
        where: whereCondition,
        skip: filters.skip || 0,
        take: filters.take || 50,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.files.count({ where: whereCondition }),
    ]);

    return { files, total };
  }

  /**
   * Get deleted files (soft deleted, for trash page)
   */
  async getDeletedFiles(filters: { skip?: number; take?: number }) {
    const [files, total] = await Promise.all([
      prisma.files.findMany({
        where: {
          status: FileStatus.DELETED,
          deletedAt: { not: null },
        },
        skip: filters.skip || 0,
        take: filters.take || 50,
        orderBy: {
          deletedAt: "desc",
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          deletedByUser: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.files.count({
        where: {
          status: FileStatus.DELETED,
          deletedAt: { not: null },
        },
      }),
    ]);

    return { files, total };
  }

  /**
   * Link file to User
   */
  async linkFileToUser(
    userId: string,
    fileId: string,
    fileType: string = "document"
  ) {
    // Check if link already exists
    const existing = await prisma.userFiles.findFirst({
      where: { userId, fileId },
    });

    if (existing) {
      return existing;
    }

    const [userFile] = await Promise.all([
      prisma.userFiles.create({
        data: {
          userId,
          fileId,
          fileType,
        },
      }),
      // Mark file as used
      this.updateFileUsage(fileId, true),
    ]);

    return userFile;
  }

  /**
   * Link file to Lead
   */
  async linkFileToLead(
    leadId: string,
    fileId: string,
    fileType: string = "document"
  ) {
    const existing = await prisma.leadFiles.findFirst({
      where: { leadId, fileId },
    });

    if (existing) {
      return existing;
    }

    const [leadFile] = await Promise.all([
      prisma.leadFiles.create({
        data: {
          leadId,
          fileId,
          fileType,
        },
      }),
      this.updateFileUsage(fileId, true),
    ]);

    return leadFile;
  }

  /**
   * Link file to Note
   */
  async linkFileToNote(noteId: string, fileId: string) {
    const existing = await prisma.noteFiles.findFirst({
      where: { noteId, fileId },
    });

    if (existing) {
      return existing;
    }

    const [noteFile] = await Promise.all([
      prisma.noteFiles.create({
        data: {
          noteId,
          fileId,
        },
      }),
      this.updateFileUsage(fileId, true),
    ]);

    return noteFile;
  }

  /**
   * Link file to Country
   */
  async linkFileToCountry(
    countryId: string,
    fileId: string,
    fileType: string = "flag"
  ) {
    const existing = await prisma.countryFiles.findFirst({
      where: { countryId, fileId },
    });

    if (existing) {
      return existing;
    }

    const [countryFile] = await Promise.all([
      prisma.countryFiles.create({
        data: {
          countryId,
          fileId,
          fileType,
        },
      }),
      this.updateFileUsage(fileId, true),
    ]);

    return countryFile;
  }

  /**
   * Unlink file from entity (mark as unused)
   */
  async unlinkFileFromUser(userId: string, fileId: string) {
    await prisma.userFiles.deleteMany({
      where: { userId, fileId },
    });

    // Check if file is still used by other entities
    const [userFilesCount, leadFilesCount, noteFilesCount, countryFilesCount] =
      await Promise.all([
        prisma.userFiles.count({ where: { fileId } }),
        prisma.leadFiles.count({ where: { fileId } }),
        prisma.noteFiles.count({ where: { fileId } }),
        prisma.countryFiles.count({ where: { fileId } }),
      ]);

    const totalUsage =
      userFilesCount + leadFilesCount + noteFilesCount + countryFilesCount;

    if (totalUsage === 0) {
      await this.updateFileUsage(fileId, false);
    }
  }

  /**
   * Get files by entity
   */
  async getFilesByUser(userId: string) {
    return prisma.userFiles.findMany({
      where: { userId },
      include: {
        file: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getFilesByLead(leadId: string) {
    return prisma.leadFiles.findMany({
      where: { leadId },
      include: {
        file: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Bulk soft delete files
   */
  async bulkSoftDelete(fileIds: string[], deletedBy: string) {
    return prisma.files.updateMany({
      where: {
        id: { in: fileIds },
      },
      data: {
        status: FileStatus.DELETED,
        deletedAt: new Date(),
        deletedBy,
        isUsed: false,
      },
    });
  }

  /**
   * Bulk permanent delete files
   */
  async bulkPermanentDelete(fileIds: string[]) {
    return prisma.files.deleteMany({
      where: {
        id: { in: fileIds },
      },
    });
  }
}

export const uploadRepository = new UploadRepository();
