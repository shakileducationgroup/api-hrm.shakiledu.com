import prisma from "../../../../lib/utils/prisma.utils";
import { LogService } from "../service/logger.service";
import {
  CreateLogParams,
  LogAction,
  LogData,
  LogLevel,
  ModuleName,
} from "../types/logger.types";

export class Logger {
  private logService: LogService;
  private operatorInfo: {
    id: string;
    role: string;
    email: string;
  };

  constructor(operatorInfo: { id: string; role: string; email: string }) {
    this.logService = new LogService();
    this.operatorInfo = operatorInfo;
  }

  async log(data: Omit<LogData, "level"> & { level?: LogLevel }) {
    const logParams: CreateLogParams = {
      ...data,
      operatorId: this.operatorInfo.id,
      operatorRole: this.operatorInfo.role,
      operatorEmail: this.operatorInfo.email,
      level: data.level || LogLevel.INFO,
    };

    // Non-blocking log creation
    return this.logService.createActivityLog(logParams);
  }

  // Convenience methods for common actions
  async create({
    module,
    description,
    entityId,
    entityType,
    data,
    metadata,
  }: {
    module: ModuleName;
    description: string;
    entityId?: string;
    entityType?: string;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    return this.log({
      action: LogAction.CREATE,
      module,
      description,
      entityId,
      entityType,
      newData: data,
      metadata,
    });
  }

  async update({
    description,
    module,
    entityId,
    entityType,
    oldData,
    newData,
    metadata,
  }: {
    module: ModuleName;
    description: string;
    entityId?: string;
    entityType?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    const changes = this.logService.extractChanges(oldData, newData);
    return this.log({
      action: LogAction.UPDATE,
      module,
      description,
      entityId,
      entityType,
      oldData,
      newData,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata,
    });
  }

  async delete({
    description,
    module,
    entityId,
    entityType,
    deletedData,
  }: {
    module: ModuleName;
    description: string;
    entityId?: string;
    entityType?: string;
    deletedData?: Record<string, unknown>;
  }) {
    return this.log({
      action: LogAction.DELETE,
      module,
      description,
      entityId,
      entityType,
      oldData: deletedData,
    });
  }

  async info(module: ModuleName, description: string, metadata?: any) {
    return this.log({
      action: LogAction.READ,
      module,
      description,
      level: LogLevel.INFO,
      metadata,
    });
  }

  async warn(module: ModuleName, description: string, metadata?: any) {
    return this.log({
      action: LogAction.UPDATE, // or appropriate action
      module,
      description,
      level: LogLevel.WARN,
      metadata,
    });
  }

  async error(
    module: ModuleName,
    description: string,
    error?: any,
    metadata?: any,
  ) {
    return this.log({
      action: LogAction.UPDATE, // or appropriate action
      module,
      description: `${description}: ${error?.message || "Unknown error"}`,
      level: LogLevel.ERROR,
      metadata: {
        ...metadata,
        error: error?.message,
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
    });
  }

  /** Create logger from userId (e.g. for webhooks where req.user is not available) */
  static async fromUserId(userId: string): Promise<Logger | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) return null;
    return new Logger({
      id: user.id,
      role: user.role,
      email: user.email,
    });
  }

  static fromRequest(req: any): Logger {
    const operatorInfo = {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
    };
    return new Logger(operatorInfo);
  }
}

// Export for easy use in other services
export { LogLevel, ModuleName };
