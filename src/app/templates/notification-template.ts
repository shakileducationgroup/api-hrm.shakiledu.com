import { NOTIFICATION_ENUM } from "../constant/notification-enum";

export const NotificationTemplates = {
  // Template for lead assignment notification
  LEAD_ASSIGNED: ({
    link,
    title,
    message,
  }: {
    title: string;
    message: string;
    link?: string;
  }) => ({
    title,
    message,
    link: link,
    type: NOTIFICATION_ENUM.LEAD_ASSIGNED,
  }),
};
