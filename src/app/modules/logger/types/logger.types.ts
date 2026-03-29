import { Prisma } from "@prisma/client";

export enum LogAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  READ = "READ",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

export type ModuleName = Prisma.ModelName;
export interface LogData {
  action: LogAction;
  module: ModuleName;
  description: string;
  entityId?: string;
  entityType?: string;
  oldData?: any;
  newData?: any;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
  level?: LogLevel;
  metadata?: Record<string, any>;
}

export interface CreateLogParams extends LogData {
  operatorId: string;
  operatorRole: string;
  operatorEmail: string;
}

export interface LogFilter {
  startDate?: Date;
  endDate?: Date;
  operatorId?: string;
  operatorRole?: string;
  module?: ModuleName;
  action?: LogAction;
  level?: LogLevel;
  entityId?: string;
  search?: string;
}

export interface PaginatedLogs {
  logs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
