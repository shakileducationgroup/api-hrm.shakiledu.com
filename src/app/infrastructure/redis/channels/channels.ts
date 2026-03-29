import { I_RedisEventPayload } from "../types/types";

export const REDIS_CHANNELS = {
  // Lead Events
  LEAD_CREATED: "lead:created",
  LEAD_UPDATED: "lead:updated",
  LEAD_ASSIGNED: "lead:assigned",
  LEAD_BULK_ASSIGNED: "lead:bulk_assigned",
  LEAD_UNASSIGNED: "lead:unassigned",
  LEAD_STATUS_CHANGED: "lead:status_changed",
  LEAD_DELETED: "lead:deleted",

  // Notification Events
  NOTIFICATION_CREATED: "notification:created",
  NOTIFICATION_SENT: "notification:sent",

  // Task Events
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_COMPLETED: "task:completed",
  TASK_ASSIGNED: "task:assigned",
  TASK_REMINDER: "task:reminder",

  // User Events
  USER_CREATED: "user:created",
  USER_UPDATED: "user:updated",

  // General Events
  EVENT_BROADCAST: "event:broadcast",
} as const;

export const getAllChannelsKey: () => string[] = () =>
  Object.keys(REDIS_CHANNELS);

export const getAllChannels = () => Object.values(REDIS_CHANNELS);

/**
 * Event Handler Type
 */
export type T_EventHandler = (
  payload: I_RedisEventPayload<any, any>,
) => Promise<void>;
