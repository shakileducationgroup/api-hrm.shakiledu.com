import { T_RedisChannel } from "../../infrastructure/redis/types/types";

export interface I_TaskNotificationEventDistinctPayload {
  taskId: string;
  title: string;
  description: string;
  dueDate?: string;
  leadName?: string;
  priority: string;
}

export interface I_OverDueTaskEventDispatcher {
  channel: T_RedisChannel;
  data: I_TaskNotificationEventDistinctPayload;
  notificationRecipient: string;
  metadata: Record<string, any>;
}

export interface I_StringifyTaskNotification {
  type: T_RedisChannel;
  taskId: string;
  title: string;
  dueDate: string;
}
