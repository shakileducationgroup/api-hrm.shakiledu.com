import { Queue } from "bullmq";
import { redis } from "../../../config/redis-connection";

export const schedulerQueue = new Queue("scheduler-queue", {
  connection: redis,
});

export const setupScheduler = async () => {
  try {
    // // Clean up old test scheduler if it exists
    try {
      await schedulerQueue.removeJobScheduler("task-reminder-test");
      console.log("🧹 Removed stale test scheduler from Redis");
    } catch (error) {
      // Scheduler doesn't exist, that's fine
    }

    // Scheduler 1: 11:30 AM Bangladesh time (5:30 AM UTC)
    await schedulerQueue.upsertJobScheduler(
      "task-reminder-morning",
      {
        pattern: "44 5 * * *", // 5:30 AM UTC = 11:30 AM Bangladesh
        tz: "UTC",
      },
      {
        name: "send-task-reminders",
        data: { purpose: "Send task reminders 1 day before due date" },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    );

    // Scheduler 2: 3:30 PM Bangladesh time (9:30 AM UTC)
    await schedulerQueue.upsertJobScheduler(
      "task-reminder-afternoon",
      {
        pattern: "30 9 * * *", // 9:30 AM UTC = 3:30 PM Bangladesh
        tz: "UTC",
      },
      {
        name: "send-task-reminders",
        data: { purpose: "Send task reminders 1 day before due date" },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    );

    //  TEST SCHEDULER DISABLED - Use addTestTaskReminder() function instead
    // await schedulerQueue.upsertJobScheduler(
    //   "task-reminder-test",
    //   {
    //     pattern: "*/10 * * * * *", // Every 10 seconds for testing
    //     tz: "UTC",
    //   },
    //   {
    //     name: "task-reminder-test",
    //     data: { purpose: "TEST: Send task reminders every minute" },
    //     opts: {
    //       attempts: 3,
    //       backoff: { type: "exponential", delay: 1000 },
    //       removeOnComplete: true,
    //       removeOnFail: false,
    //     },
    //   },
    // );

    // console.log("⏰ Task reminder schedulers setup successfully");

    // Optional: List all schedulers to verify
    const schedulers = await schedulerQueue.getJobSchedulers(0, 10, true);

    // Check both schedulers
    const morningScheduler = schedulers.find(
      (s) => s.key === "task-reminder-morning",
    );

    const afternoonScheduler = schedulers.find(
      (s) => s.key === "task-reminder-afternoon",
    );

    if (morningScheduler) {
      // @ts-ignore
      const nextDate = new Date(morningScheduler.next);
      console.log("🌅 MORNING REMINDER (11:30 AM Bangladesh)");
      console.log("   ⏳ Next execution (UTC):", nextDate.toUTCString());
      console.log("   🌐 Local time:", nextDate.toString());
    }

    if (afternoonScheduler) {
      // @ts-ignore
      const nextDate = new Date(afternoonScheduler.next);
      console.log("🌆 AFTERNOON REMINDER (3:30 PM Bangladesh)");
      console.log("   ⏳ Next execution (UTC):", nextDate.toUTCString());
      console.log("   🌐 Local time:", nextDate.toString());
    }

    if (!morningScheduler || !afternoonScheduler) {
      console.warn("ℹ️ WARNING: Not all schedulers found!");
    }

    /*     const testScheduler = schedulers.find(
      (s) => s.key === "task-reminder-test",
    );

    if (testScheduler) {
      // @ts-ignore
      const nextDate = new Date(testScheduler.next);
      console.log("🧪 TEST REMINDER (Every minute)");
      console.log("   ⏳ Next execution (UTC):", nextDate.toUTCString());
      console.log("   🌐 Local time:", nextDate.toString());
      console.log("   ⚠️  REMOVE THIS AFTER TESTING!");
    } */
  } catch (error) {
    console.error("❌ Failed to setup scheduler:", error);
  }
};

// Run scheduler setup if this file is executed directly
if (require.main === module) {
  setupScheduler()
    .then(() => {
      console.log("Scheduler setup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Scheduler setup failed:", error);
      process.exit(1);
    });
}

export default setupScheduler;
