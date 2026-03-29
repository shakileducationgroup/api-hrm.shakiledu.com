import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";

import path from "path";
import corsOptions from "./app/config/corsOption";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";

import { emailQueue } from "./app/infrastructure/queue/email/email-queue";
import routes from "./app/routes";

// ** making app variable and store it into express functions
const app: Application = express();

//  **  Cross Origin Resource Sharing // ? now it will receive all the req
app.use(cors(corsOptions));
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

/**
 * IMPORTANT:
 * Meta Webhooks signature verification needs raw request body.
 * So we attach rawBody ONLY for /api/v1/webhooks/* requests,
 * and we SKIP the global express.json() for that path.
 */
app.use(
  "/api/v1/webhooks",
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf; // Buffer
    },
  }),
);

// Global JSON parser for all non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/v1/webhooks")) return next();
  return express.json()(req, res, next);
});

// ** Parser
// app.use(express.json());

//  ** built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser() as any);

// ** express.static() is a built-in middleware in Express used to serve static files (e.g., images, stylesheets, JavaScript files, fonts, etc.) from a specified directory.
app.use(express.static(path.join(__dirname, "..", "public"))); // Use '..' to move out of the 'src' folder

//** Routing
app.get("/", async (req, res) => {
  res.status(200).json({ message: "checking API health 👩‍⚕️" });
});

//  Using routes for whole application

app.use("/api/v1", routes);

//  Global error handler Function
app.use(globalErrorHandler as any);

// TODO  => Not Found handler route
app.use(notFound as any);

export default app;
