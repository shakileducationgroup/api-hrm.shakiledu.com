import { HttpStatusCode } from "axios";
import { TaskStatus } from "@prisma/client";
import { Worker } from "bullmq";
import prisma from "../../../lib/utils/prisma.utils";
import { redis } from "../../config/redis-connection";
import AppError from "../../errors/appError";
import {
  I_OverDueTaskEventDispatcher,
  I_TaskNotificationEventDistinctPayload,
} from "../../interface/notification/notification.types";
import { REDIS_CHANNELS } from "../redis/channels/channels";
import { redisEventPublisher } from "../redis/publisher/redis-event-publisher";

// Retry utility function
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
): Promise<T> => {
  let lastError: Error = new Error("Task reminder retry errors");
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw new AppError(
    HttpStatusCode.InternalServerError,
    `Operation failed after ${maxRetries} attempts: ${lastError?.message}`,
  );
};

const scheduleWorker = new Worker(
  "scheduler-queue",
  async (job) => {
    console.log(`💡 Processing job: ${job.name} (ID: ${job.id})`);
    // if (job.name === "task-reminder-test") {
    //   console.log("🔔 TEST: Task reminder test job executed");

    //   redisEventPublisher.publishEvent({
    //     channel: "task:reminder",
    //     data: {
    //       taskId: "696b53f2131dc67bbafcfc64",
    //       title: "Take papers",
    //       description: "Take all necessary papers",
    //       dueDate: "2024-06-07T00:00:00.000Z",
    //       leadName: "John Doe",
    //       priority: "High",
    //     },
    //     notificationRecipient: "696759976fa3babb9a2eeea3",
    //     metadata: {
    //       taskId: "696b53f2131dc67bbafcfc64",
    //       assignedToId: "696759976fa3babb9a2eeea3",
    //     },
    //   });
    // }
    if (job.name === "send-task-reminders") {
      try {
        const now = new Date();

        // 1. Mark as OVERDUE all tasks whose due date has passed
        const overdueResult = await prisma.task.updateMany({
          where: {
            dueDate: { lt: now },
            status: { notIn: [TaskStatus.COMPLETED, TaskStatus.OVERDUE, TaskStatus.CANCELLED] },
          },
          data: { status: TaskStatus.OVERDUE },
        });
        if (overdueResult.count > 0) {
          console.log(`📌 Marked ${overdueResult.count} task(s) as OVERDUE`);
        }

        // 2. Date ranges for upcoming reminders
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        // 3. Query tasks DUE TODAY or TOMORROW (for reminder notifications)
        const tasksBecomingOverdue = await prisma.task.findMany({
          where: {
            OR: [
              { dueDate: { gte: todayStart, lte: todayEnd } },
              { dueDate: { gte: tomorrowStart, lte: tomorrowEnd } },
            ],
            status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
          },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            assignedToId: true,
            leadId: true,
            countryId: true,
            createdById: true,
            priority: true,
            assignedTo: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
            lead: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        });

        console.log(
          `⏰ Found ${tasksBecomingOverdue.length} tasks due today or tomorrow`,
        );

        if (tasksBecomingOverdue.length === 0) {
          return {
            success: 0,
            failed: 0,
            totalTasks: 0,
            remindersProcessed: 0,
          };
        }

        // 3. Send reminder notifications for tasks becoming overdue
        const remindPromises: Promise<any>[] = [];

        for (const task of tasksBecomingOverdue) {
          if (!task.assignedToId) continue;
          const assigneeId = task.assignedToId;
          remindPromises.push(
            retryOperation(
              async () => {
                redisEventPublisher.publishEvent({
                  channel: REDIS_CHANNELS.TASK_REMINDER,
                  data: {
                    taskId: task.id,
                    title: task.title,
                    description: task.description,
                    dueDate: task.dueDate?.toISOString() ?? new Date().toISOString(),
                    leadName: task.lead?.fullName || "",
                    priority: task.priority,
                  } as I_TaskNotificationEventDistinctPayload,
                  notificationRecipient: assigneeId,
                  metadata: { taskId: task.id, assignedToId: assigneeId },
                } as I_OverDueTaskEventDispatcher);

                console.log(
                  `⏰ Reminder sent for task ${task.id} to user ${assigneeId} - Due: ${task.dueDate}`,
                );
                return { taskId: task.id, assignedToId: assigneeId, status: "reminded" };
              },
              3,
              1000,
            ),
          );
        }

        // 4. Execute all reminders
        const results = await Promise.allSettled(remindPromises);

        // 5. Analyze results
        const successful = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;

        const failedDetails = results
          .map((result, index) =>
            result.status === "rejected"
              ? {
                  taskId: tasksBecomingOverdue[index]?.id,
                  error: result.reason.message,
                }
              : null,
          )
          .filter(Boolean);

        console.log(`📊 Task reminder results:`, {
          successful,
          failed,
          totalTasks: tasksBecomingOverdue.length,
          failedDetails,
        });

        return {
          success: successful,
          failed: failed,
          totalTasks: tasksBecomingOverdue.length,
          remindersProcessed: remindPromises.length,
          failedDetails,
        };
      } catch (error) {
        console.error("Error processing task reminders:", error);
        throw error;
      }
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process multiple jobs concurrently
  },
);

// Job event listeners
scheduleWorker.on("completed", (job) => {
  console.log(`✨ Job ${job.id} completed successfully`);
});

scheduleWorker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);
});

scheduleWorker.on("error", (error) => {
  console.error("❌ Worker error:", error);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`✨ Received ${signal}, closing worker...`);
  await scheduleWorker.close();
  console.log("✅ Worker closed gracefully");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// console.log("📣 Task reminder worker started and listening for jobs...");

export default scheduleWorker;
