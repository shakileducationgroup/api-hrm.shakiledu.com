import { Prisma } from "@prisma/client";
import { Worker } from "bullmq";
import { redis } from "../../config/redis-connection";
import { notificationService } from "../../modules/notification/service/notification.service";

export interface I_NotificationPayload {
  senderId: string | undefined;
  receiverId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: string;
  relatedEntityId?: string;
  relationWith: Prisma.ModelName;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

export const notificationWorker = () => {
  return new Worker(
    "notifications",
    async (job) => {
      // Match the structure you're actually adding to the queue
      const {
        senderId,
        receiverId,
        notificationTitle,
        notificationMessage,
        notificationType,
        relatedEntityId,
        relationWith,
        metadata,
        actionUrl,
      } = job.data as I_NotificationPayload;

      try {
        await notificationService.createNotification({
          senderId,
          receiverId,
          notificationTitle,
          notificationMessage,
          notificationType,
          relatedEntityId,
          relationWith,
          metadata,
          actionUrl,
        });
        console.log(`📣 Notification created for job ${job.id}`);
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 5,
      settings: {
        //maxStalledCount: 2,
      },
    },
  );
};

const worker = notificationWorker();

// Keep your event handlers
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job: any, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});
