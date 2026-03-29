import { NotificationType } from "@prisma/client";
import { I_QueryOptionsWithPagination } from "../../../interface/common.interface";

export interface I_TaskNotification {
  notificationTitle: string;
  notificationMessage: string;
  receiverId: string;
  notificationType: NotificationType;
  metadata: Record<string, any>;
}

export interface I_NotificationQuery extends I_QueryOptionsWithPagination {
  status?: "read" | "unread" | "leads" | "tasks" | "all";
}
