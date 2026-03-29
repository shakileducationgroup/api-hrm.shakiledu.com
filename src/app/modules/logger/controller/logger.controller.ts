// controllers/log.controller.ts
import { HttpStatusCode } from "axios";
import { Request, Response } from "express";
import sendResponse from "../../../../lib/utils/sendResponse";
import { LogService } from "../service/logger.service";
import { LogFilter } from "../types/logger.types";

export class LogController {
  private logService: LogService;

  constructor() {
    this.logService = new LogService();
  }

  getLogs = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        operatorId,
        operatorRole,
        module,
        action,
        level,
        entityId,
        search,
        page = 1,
        limit = 50,
      } = req.query;

      const filter: LogFilter = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(operatorId && { operatorId: operatorId as string }),
        ...(operatorRole && { operatorRole: operatorRole as string }),
        ...(module && { module: module as any }),
        ...(action && { action: action as any }),
        ...(level && { level: level as any }),
        ...(entityId && { entityId: entityId as string }),
        ...(search && { search: search as string }),
      };

      const result = await this.logService.getActivityLogs(
        filter,
        parseInt(page as string),
        parseInt(limit as string),
      );

      sendResponse(res, {
        statusCode: HttpStatusCode.Ok,
        success: true,
        message: "Getting logs success",
        data: result,
      });
    } catch (error) {
      console.error("Get logs error:", error);
      sendResponse(res, {
        statusCode: HttpStatusCode.InternalServerError,
        success: false,
        message: "Failed to fetch logs",
      });
    }
  };

  getLogById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const log = await this.logService.getLogById(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: "Log not found",
        });
      }

      sendResponse(res, {
        statusCode: HttpStatusCode.Ok,
        success: true,
        message: "Getting log by ID success",
        data: log,
      });
    } catch (error) {
      console.error("Get log by ID error:", error);
      sendResponse(res, {
        statusCode: HttpStatusCode.InternalServerError,
        success: false,
        message: "Failed to fetch log by ID",
      });
    }
  };

  getCallStats = async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || (req.user as any)?.id;
      if (!userId) {
        return sendResponse(res, {
          statusCode: HttpStatusCode.BadRequest,
          success: false,
          message: "userId required",
        });
      }
      const stats = await this.logService.getCallStats(userId);
      sendResponse(res, {
        statusCode: HttpStatusCode.Ok,
        success: true,
        message: "Call stats retrieved",
        data: stats,
      });
    } catch (error) {
      console.error("Get call stats error:", error);
      sendResponse(res, {
        statusCode: HttpStatusCode.InternalServerError,
        success: false,
        message: "Failed to fetch call stats",
      });
    }
  };

  cleanupLogs = async (req: Request, res: Response) => {
    try {
      const { retentionDays = 90 } = req.body;
      const deletedCount = await this.logService.cleanupOldLogs(retentionDays);

      sendResponse(res, {
        statusCode: HttpStatusCode.Ok,
        success: true,
        message: "Logs cleaned up successfully",
        data: deletedCount,
      });
    } catch (error) {
      console.error("Cleanup logs error:", error);
      sendResponse(res, {
        statusCode: HttpStatusCode.InternalServerError,
        success: false,
        message: "Failed to cleanup logs",
      });
    }
  };
}
