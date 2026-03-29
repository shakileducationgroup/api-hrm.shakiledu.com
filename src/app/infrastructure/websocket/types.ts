import { WebSocket } from "ws";
export interface MessageData {
  type:
    | "register"
    | "get"
    | "message"
    | "update"
    | "disconnect"
    | "notification";
  userId?: string;
  senderId?: string;
  receiverId?: string;
  message?: string;
  messageId?: string;
  content?: string;
  data?: any;
  action?: "markAsRead" | "dismiss" | "getAll" | "getUnread";
  notificationId?: string;
}

export interface WebSocketNotification {
  type: "notification";
  data: {
    id: string;
    senderId: string;
    receiverId: string;
    notificationTitle: string;
    notificationMessage: string;
    notificationType: string;
    isRead: boolean;
    readAt?: Date;
    relatedEntityId?: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    sender?: {
      id: string;
      firstName: string;
      lastName: string;
      profile?: {
        photoUrl: string;
      };
    };
  };
}

export interface NotificationAction {
  action: "markAsRead" | "dismiss" | "getAll" | "getUnread";
  notificationId?: string;
  userId?: string;
}
export interface ExtendedWebSocket extends WebSocket {
  userId?: string;
}

export type ConnectionCallback = (socket: WebSocket) => void;
