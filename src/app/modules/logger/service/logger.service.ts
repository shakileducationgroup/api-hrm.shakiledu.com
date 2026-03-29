import LogRepository from "../repository/logger.repository";
import {
  CreateLogParams,
  LogFilter,
  PaginatedLogs,
} from "../types/logger.types";

export class LogService {
  private logRepository: LogRepository;

  constructor() {
    this.logRepository = new LogRepository();
  }

  async createActivityLog(logData: CreateLogParams) {
    // Validate required fields
    if (
      !logData.operatorId ||
      !logData.module ||
      !logData.action ||
      !logData.description
    ) {
      console.warn("Missing required log fields:", {
        operatorId: logData.operatorId,
        module: logData.module,
        action: logData.action,
        description: logData.description,
      });
      return null;
    }

    try {
      return await this.logRepository.createLog(logData);
    } catch (error) {
      console.error("Log service error:", error);
      return null;
    }
  }

  async getActivityLogs(
    filter: LogFilter,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedLogs> {
    // Validate pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 records per page

    return this.logRepository.getLogs(filter, validPage, validLimit);
  }

  async getLogById(id: string) {
    if (!id) {
      throw new Error("Log ID is required");
    }
    return this.logRepository.getLogById(id);
  }

  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    if (retentionDays < 1) {
      throw new Error("Retention days must be at least 1");
    }
    return this.logRepository.cleanupOldLogs(retentionDays);
  }

  async getCallStats(userId: string) {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const [todayLogs, weekLogs, monthLogs] = await Promise.all([
      this.logRepository.getCallLogsForStats(userId, startOfToday, now),
      this.logRepository.getCallLogsForStats(userId, startOfWeek, now),
      this.logRepository.getCallLogsForStats(userId, startOfMonth, now),
    ]);

    const countByType = (logs: any[]) => {
      let tried = 0;
      let success = 0;
      logs.forEach((log) => {
        const ct = (log.metadata as any)?.callType;
        if (ct === "tried") tried++;
        else if (ct === "success") success++;
      });
      return { tried, success };
    };

    const details = monthLogs.slice(0, 50).map((log) => ({
      id: log.id,
      description: log.description,
      timestamp: log.timestamp,
      metadata: log.metadata,
      operator: log.operator,
    }));

    return {
      today: countByType(todayLogs),
      thisWeek: countByType(weekLogs),
      lastMonth: countByType(monthLogs),
      details,
    };
  }

  extractChanges(
    oldData: any,
    newData: any,
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    if (!oldData || !newData) return changes;

    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    allKeys.forEach((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Deep comparison for objects/arrays
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    });

    return changes;
  }
}
