import http, { Server } from "http";
import app from "./app";
import env from "./app/config/clean-env";

import setupScheduler from "./app/infrastructure/queue/scheduler/scheduler-queue";
import { redisEventSubscriber } from "./app/infrastructure/redis/subscriber/redis-event-subscriber";
import { socketManager } from "./app/infrastructure/websocket/initSocket";
import { createEmailWorker } from "./app/infrastructure/worker/email-worker";
import { notificationWorker } from "./app/infrastructure/worker/notification-worker";
import scheduleWorker from "./app/infrastructure/worker/task-schedule-worker";
import { T_Worker } from "./app/interface/common.interface";
import getLocalIPAddress from "./lib/utils/getLocalIpAdd";
import seedSuperAdmin from "./lib/utils/seeding-super-admin";

let server: Server;

// Server initialization (server.ts)
server = http.createServer(app);

let workers: {
  email: T_Worker;
  notification: T_Worker;
  schedule: T_Worker;
} = {
  email: null,
  notification: null,
  schedule: null,
};
// Initializing the server
async function startServer() {
  try {
    const port = !env.isDev ? env.PORT : env.STAGING_PORT;
    console.log("📌 Starting main server in instance of ☁️ ", env.APP_INSTANCE);

    // Initialize socket manager
    console.log(
      "=============================== Init socket server ===============================",
    );

    socketManager.initSocket(server);
    console.log("📦 PORT:", port);
    console.log(
      "=============================== Initialized the server ===============================",
    );

    await redisEventSubscriber.subscribeToAllChannels();
    console.log("✅ Redis event subscriber initialized");
    //await ensureFGAStoreAndModel();

    console.log("⛏ Seeding admin...");
    await seedSuperAdmin();

    // assigning workers to variables
    await setupScheduler();
    workers.email = createEmailWorker();
    workers.notification = notificationWorker();
    workers.schedule = scheduleWorker; // Schedule worker is already instantiated

    // Start server
    server.listen(port, "0.0.0.0", () => {
      console.log("🚀 Server running at:");
      console.log(`  ➜ Local:   http://localhost:${port}`);
      console.log(`  ➜ Network: http://${getLocalIPAddress()}:${port}`);
      console.log(`  ➜ Available: http://0.0.0.0:${port}`);
    });

    // Make io accessible globally
  } catch (error: any) {
    console.error(`⚠️☠️ Server closed by error: ${(error as Error).message}`);
    await workers?.email?.close();
    await workers?.notification?.close();
    await workers?.schedule?.close();
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (m, reason) => {
  console.log("⚠️☠️ Server closed by unhandledRejection", reason);
  // console.log("🚀 ~ process.on ~ server:", m);

  // unhandled rejection
  if (server) {
    console.log("+++++++++++++ Because of server still exist +++++++++++++");
    server.close(async () => {
      await workers?.email?.close();
      await workers?.notification?.close();
      await workers?.schedule?.close();
      process.exit(1);
    });
  }

  console.log("+++++++++++++ Server is not exist +++++++++++++");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.log("⚠️☠️ Server closed by uncaught exception", error.stack || error);
  if (server) {
    server.close(async () => {
      await workers?.email?.close();
      await workers?.notification?.close();
      await workers?.schedule?.close();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// added mirror
