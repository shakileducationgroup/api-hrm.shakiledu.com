import { Router } from "express";
import { authenticate } from "../../../middleware/auth";
import { notificationController } from "../controller/notification.controller";

const notificationRouter = Router();

/**
 * GET /api/v1/notifications
 * Get all notifications for the authenticated user
 */
notificationRouter
  .route("/")
  .get(authenticate, notificationController.getNotifications);

/**
 * PATCH /api/v1/notifications/mark-as-completed
 * Mark all notifications as completed/read for the authenticated user
 */
notificationRouter
  .route("/mark-as-completed")
  .patch(authenticate, notificationController.markAllNotificationAsRead);

/**
 * PATCH /api/v1/notifications/mark-as-completed
 * Mark all notifications as completed/read for the authenticated user
 */
notificationRouter
  .route("/update/mark-as-completed/:notificationId")
  .patch(authenticate, notificationController.markSingleNotificationAsRead);

export const notificationRoutes = notificationRouter;
