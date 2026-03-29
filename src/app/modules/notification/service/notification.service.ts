import { Prisma } from "@prisma/client";
import { HttpStatusCode } from "axios";
import {
  calcTotalPages,
  calculatePagination,
} from "../../../../lib/utils/calcPagination";
import prisma from "../../../../lib/utils/prisma.utils";
import AppError from "../../../errors/appError";
import { NotificationAction } from "../../../infrastructure/websocket/types";
import { I_NotificationPayload } from "../../../infrastructure/worker/notification-worker";
import { I_PaginationResponse } from "../../../interface/common.interface";
import { globalRepository } from "../../global/repository/global.repository";
import { notificationRepository } from "../repository/notification.repository";
import {
  I_NotificationQuery,
  I_TaskNotification,
} from "../types/notification.types";

export class NotificationService {
  /**
   * Create a notification in DB and publish to Redis for real-time delivery
   * This is the main entry point for creating notifications
   */
  async createNotification(payload: I_NotificationPayload) {
    /* 
    
        senderId: string | undefined;
        receiverId: string;
        notificationTitle: string;
        notificationMessage: string;
        notificationType: string;
        relatedEntityId?: string;
        relationWith: Prisma.ModelName;
        metadata?: Record<string, any>;
    
    */
    try {
      // Step 1: Save notification to database
      const notification = await prisma.notification.create({
        data: {
          notificationTitle: payload.notificationTitle,
          notificationMessage: payload.notificationMessage,
          notificationType: payload.notificationType,
          senderId: payload.senderId || undefined,
          receiverId: payload.receiverId,
          relatedEntityId: payload.relatedEntityId,
          metadata: payload.metadata,
          actionUrl: payload.actionUrl,
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  userImage: true,
                },
              },
            },
          },
        },
      });

      console.log(
        `💾 Notification saved to DB: ${notification.id} for user ${notification.receiverId}`,
      );

      return notification;
    } catch (error) {
      console.error("❌ Error creating and publishing notification:", error);
      throw error;
    }
  }

  /**
   * Handle notification actions from clients (mark as read, dismiss, fetch, etc.)
   */
  async handleNotificationAction(
    action: NotificationAction,
    socket: any,
  ): Promise<void> {
    try {
      switch (action.action) {
        case "markAsRead":
          await this.markAsRead(action.notificationId!, action.userId!);
          break;

        case "dismiss":
          await this.dismissNotification(
            action.notificationId!,
            action.userId!,
          );
          break;

        case "getAll":
          await this.sendUserNotifications(action.userId!, socket);
          break;

        case "getUnread":
          await this.sendUnreadNotifications(action.userId!, socket);
          break;

        default:
          throw new Error(`Unknown notification action: ${action.action}`);
      }
    } catch (error) {
      console.error("Error handling notification action:", error);
      this.sendError(socket, error);
    }
  }

  private async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        receiverId: userId, // Ensure user owns the notification
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    console.log(
      `✅ Notification ${notificationId} marked as read by user ${userId}`,
    );
  }

  private async dismissNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    // You can either soft delete or actually delete based on your needs
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        receiverId: userId,
      },
    });
    console.log(
      `🗑️ Notification ${notificationId} dismissed by user ${userId}`,
    );
  }

  private async sendUserNotifications(
    userId: string,
    socket: any,
  ): Promise<void> {
    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: { firstName: true, lastName: true, userImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50 notifications
    });

    socket.send(
      JSON.stringify({
        type: "allNotifications",
        data: notifications,
      }),
    );
  }

  private async sendUnreadNotifications(
    userId: string,
    socket: any,
  ): Promise<void> {
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,

            profile: {
              select: { firstName: true, lastName: true, userImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    socket.send(
      JSON.stringify({
        type: "unreadNotifications",
        data: unreadNotifications,
      }),
    );
  }

  private sendError(socket: any, error: unknown): void {
    try {
      socket.send(
        JSON.stringify({
          type: "error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        }),
      );
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    { status, ...query }: I_NotificationQuery,
  ) {
    const { page, skip, sortBy, sortOrder, limit } = calculatePagination(query);

    const whereCondition: Prisma.NotificationWhereInput = {
      receiverId: userId,
    };

    // Filter by status
    if (status === "read") {
      whereCondition.isRead = true;
    } else if (status === "unread") {
      whereCondition.isRead = false;
    } else if (status === "leads") {
      whereCondition.relationWith = "Leads" as Prisma.ModelName;
    } else if (status === "tasks") {
      whereCondition.relationWith = "Task" as Prisma.ModelName;
    }

    const [notifications, totalCount, unreadNotifications] = await Promise.all([
      notificationRepository.getUserNotifications({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sender: {
            select: {
              id: true,
              role: true,
              email: true,
              profile: {
                select: { firstName: true, lastName: true, userImage: true },
              },
            },
          },
        },
      }),

      // get total count
      globalRepository.getCollectionCount({
        modelName: "Notification",
        whereCondition,
      }),

      // get unread count
      globalRepository.getCollectionCount({
        modelName: "Notification",
        whereCondition: {
          receiverId: userId,
          isRead: false,
        },
      }),
    ]);

    const paginationResponse: I_PaginationResponse<any> = {
      meta: {
        limit,
        totalPages: calcTotalPages(totalCount, limit),
        page,
        totalCount,
      },
      result: {
        unreadNotification: unreadNotifications,
        notifications,
      },
    };

    return paginationResponse;
  }

  /**
   * Mark all notifications as completed/read for a user
   */
  async markAllNotificationAsRead(userId: string) {
    const result = await notificationRepository.markAllNotificationAsRead({
      where: { receiverId: userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      modifiedCount: result.count,
      message: `${result.count} notification(s) marked as completed`,
    };
  }

  /**
   * Mark single notification as read
   */

  async markNotificationAsRead(notificationId: string, userId: string) {
    // First, verify the notification exists
    const notification = await notificationRepository.findUnique({
      where: { id: notificationId, receiverId: userId },
    });

    if (!notification) {
      throw new AppError(
        HttpStatusCode.NotFound,
        `Notification ${notificationId} not found`,
      );
    }

    if (notification.receiverId !== userId) {
      throw new AppError(
        HttpStatusCode.NotFound,
        `User ${userId} is not authorized to update this notification`,
      );
    }

    if (notification.isRead) {
      return notification; // Already marked as read
    }
    const result = await notificationRepository.markSingleNotificationAsRead({
      where: {
        id: notificationId,
        receiverId: userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result;
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    // First, verify the notification exists
    const notification = await notificationRepository.findUnique({
      where: { id: notificationId, receiverId: userId },
    });

    if (!notification) {
      throw new AppError(
        HttpStatusCode.NotFound,
        `Notification ${notificationId} not found`,
      );
    }

    if (notification.receiverId !== userId) {
      throw new AppError(
        HttpStatusCode.NotFound,
        `User ${userId} is not authorized to delete this notification`,
      );
    }

    const result = await notificationRepository.deleteNotification({
      where: {
        id: notificationId,
        receiverId: userId,
      },
    });

    return result;
  }

  // Task notification create

  async createTaskNotification(payload: I_TaskNotification) {
    const result = await notificationRepository.createTaskNotification({
      data: {
        ...payload,
      },
    });

    return result;
  }
}

export const notificationService = new NotificationService();
