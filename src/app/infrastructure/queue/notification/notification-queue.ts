import { Queue } from "bullmq";
import { redis } from "../../../config/redis-connection";
import { I_NotificationPayload } from "../../worker/notification-worker";

export const notificationQueue = new Queue("notifications", {
  connection: redis,
});

// Function to add notification jobs to the queue
export const addNotificationToQueue = async (
  notificationData: I_NotificationPayload,
) => {
  return await notificationQueue.add("notifications", notificationData, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5 seconds between retries
    },
    removeOnComplete: true, // Remove job from queue when completed
    removeOnFail: {
      age: 24 * 3600, // Keep failed jobs for 24 hours
    },
  });
};
