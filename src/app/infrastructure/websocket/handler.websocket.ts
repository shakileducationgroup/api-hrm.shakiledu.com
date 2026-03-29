import { WebSocket } from "ws";

import { clientManager } from "./clientManager";

import { HttpStatusCode } from "axios";
import AppError from "../../errors/appError";
import { ExtendedWebSocket, MessageData } from "./types";

export class SocketHandler {
  async decideTheChannel(
    parsed: MessageData,
    socket: WebSocket,
  ): Promise<void> {
    const extendedSocket = socket as ExtendedWebSocket;

    switch (parsed.type) {
      case "register":
        await this.handleRegistration(parsed, extendedSocket);
        break;

      case "notification":
        await this.handleNotificationAction(parsed, extendedSocket);
        break;

      case "disconnect":
        await this.handleDisconnect(parsed, extendedSocket);
        break;

      default:
        console.warn(`⚠️ Unknown message type: ${parsed.type}`);
      // Don't throw error, just log and continue
    }
  }

  /**
   *
   *
   */
  private async handleRegistration(
    parsed: MessageData,
    socket: ExtendedWebSocket,
  ): Promise<void> {
    if (!parsed.userId) {
      throw new AppError(
        HttpStatusCode.NotFound,
        "User ID required for registration",
      );
    }

    clientManager.addClient(parsed.userId, socket);

    // Acknowledge registration
    socket.send(
      JSON.stringify({
        type: "registered",
        user: parsed.userId,
        success: true,
      }),
    );
  }

  private async handleDisconnect(
    parsed: MessageData,
    socket: ExtendedWebSocket,
  ): Promise<void> {
    if (!parsed.userId) {
      throw new Error("User ID required for disconnect");
    }
    clientManager.removeClient(parsed.userId);
    socket.close(1000, "Client requested disconnect");
  }

  private async handleNotificationAction(
    parsed: MessageData,
    socket: ExtendedWebSocket,
  ): Promise<void> {
    if (!parsed.action) {
      throw new Error("Notification action required");
    }

    if (
      parsed.action !== "getAll" &&
      parsed.action !== "getUnread" &&
      !parsed.userId
    ) {
      throw new Error("User ID required for notification actions");
    }

    // await notificationService.handleNotificationAction(
    //   {
    //     action: parsed.action,
    //     notificationId: parsed.notificationId,
    //     userId: parsed.userId,
    //   },
    //   socket,
    // );
  }
}

// Singleton instance
export const socketHandler = new SocketHandler();
socketHandler.decideTheChannel;
