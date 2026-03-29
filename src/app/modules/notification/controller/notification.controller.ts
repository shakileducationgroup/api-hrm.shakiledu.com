import { HttpStatusCode } from "axios";
import asyncHandler from "../../../../lib/utils/async-handler";
import sendResponse from "../../../../lib/utils/sendResponse";
import { I_GlobalJwtPayload } from "../../../interface/common.interface";
import { notificationService } from "../service/notification.service";
import { I_NotificationQuery } from "../types/notification.types";

class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  getNotifications = asyncHandler(async (req, res) => {
    const userId = (req.user as I_GlobalJwtPayload).id;
    const query = req.query as I_NotificationQuery;

    const notifications = await notificationService.getUserNotifications(
      userId,
      query,
    );

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  });

  /**
   * Mark all notifications as completed/read for a user
   */
  markAllNotificationAsRead = asyncHandler(async (req, res) => {
    const userId = (req.user as I_GlobalJwtPayload).id;

    const result = await notificationService.markAllNotificationAsRead(userId);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "All notifications marked as completed",
      data: result,
    });
  });

  /**
   * Mark all notifications as completed/read for a user
   */
  markSingleNotificationAsRead = asyncHandler(async (req, res) => {
    const userId = (req.user as I_GlobalJwtPayload).id;
    const { notificationId } = req.params as { notificationId: string };

    const result = await notificationService.markNotificationAsRead(
      notificationId,
      userId,
    );

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  });

  // notificationHandlers = {
  //   getNotifications,
  //   markAllNotificationAsRead,
  //   markSingleNotificationAsRead,
  // };
}

export const notificationController = new NotificationController();
