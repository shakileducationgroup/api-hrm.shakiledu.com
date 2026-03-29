import { PrismaClient } from "@prisma/client";
import {
  CreateLogParams,
  LogFilter,
  PaginatedLogs,
} from "../types/logger.types";

const prisma = new PrismaClient();

class LogRepository {
  async createLog(logData: CreateLogParams) {
    try {
      return await prisma.activityLog.create({
        data: {
          action: logData.action,
          module: logData.module,
          description: logData.description,
          entityId: logData.entityId,
          entityType: logData.entityType,
          oldData: logData.oldData,
          newData: logData.newData,
          changes: logData.changes,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          level: logData.level || "INFO",
          metadata: logData.metadata,
          operator: {
            connect: {
              id: logData.operatorId,
            },
          },
          operatorRole: logData.operatorRole,
          operatorEmail: logData.operatorEmail,
        },
      });
    } catch (error) {
      console.error("Failed to create log:", error);
      // Don't throw error to avoid breaking main operations
      return null;
    }
  }

  async getLogs(
    filter: LogFilter,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedLogs> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = filter.startDate;
      if (filter.endDate) where.timestamp.lte = filter.endDate;
    }

    if (filter.operatorId) where.operatorId = filter.operatorId;
    if (filter.operatorRole) where.operatorRole = filter.operatorRole;
    if (filter.module) where.module = filter.module;
    if (filter.action) where.action = filter.action;
    if (filter.level) where.level = filter.level;
    if (filter.entityId) where.entityId = filter.entityId;

    if (filter.search) {
      where.OR = [
        { description: { contains: filter.search, mode: "insensitive" } },
        { operatorEmail: { contains: filter.search, mode: "insensitive" } },
        { entityId: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          operator: {
            select: {
              id: true,

              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  fullName: true,
                },
              },
              email: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogById(id: string) {
    return prisma.activityLog.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                fullName: true,
              },
            },
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.activityLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  async getCallLogsForStats(userId: string, startDate: Date, endDate: Date) {
    return prisma.activityLog.findMany({
      where: {
        module: "CallRecording",
        operatorId: userId,
        timestamp: { gte: startDate, lte: endDate },
      },
      include: {
        operator: {
          select: {
            id: true,
            profile: { select: { fullName: true } },
            email: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });
  }
}
export const logRepository = new LogRepository();
export default LogRepository;
