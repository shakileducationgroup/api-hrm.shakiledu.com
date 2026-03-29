import { Prisma } from "@prisma/client";
import prisma from "../../../../lib/utils/prisma.utils";

class NotificationRepository {
  constructor() {}

  // Get unique notification
  async findUnique<T extends Prisma.NotificationFindUniqueArgs>(
    args: T,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.notification.findUnique(args);
  }

  // Get all notifications
  async getUserNotifications<T extends Prisma.NotificationFindManyArgs>(
    args: T,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.notification.findMany(args) as Promise<
      Prisma.NotificationGetPayload<T>[]
    >;
  }

  // Mark all notifications as completed/read for a user
  async markAllNotificationAsRead<T extends Prisma.NotificationUpdateManyArgs>(
    args: T,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.notification.updateMany(args) as Promise<Prisma.BatchPayload>;
  }

  // Mark single notification as read
  async markSingleNotificationAsRead<T extends Prisma.NotificationUpdateArgs>(
    args: T,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.notification.update(args);
  }

  // Delete notification
  async deleteNotification<T extends Prisma.NotificationDeleteArgs>(
    args: T,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.notification.delete(args);
  }

  //=====================================================================================
  // TASK NOTIFICATION METHODS
  //=====================================================================================
  async createTaskNotification<T extends Prisma.TaskNotificationCreateArgs>(
    args: T,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.notification.create(args);
  }
}

export const notificationRepository = new NotificationRepository();
