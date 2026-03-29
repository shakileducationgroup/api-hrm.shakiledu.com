import { WebSocket } from "ws";
import env from "../../config/clean-env";
import { ExtendedWebSocket } from "./types";

export class ClientManager {
  private clients = new Map<string, ExtendedWebSocket>();

  // ✅ CORRECT: Add new client
  addClient(userId: string, socket: ExtendedWebSocket): void {
    // Clean up existing connection for this user
    this.removeClient(userId);

    const extendedSocket = socket as ExtendedWebSocket;
    extendedSocket.userId = userId;
    this.clients.set(userId, extendedSocket);

    console.log(
      `✅ User ${userId} registered. Total clients: ${this.clients.size}`,
    );
  }

  // ✅ CORRECT: Remove client
  removeClient(userId: string): void {
    const existing = this.clients.get(userId);
    if (existing) {
      if (existing.readyState === existing.OPEN) {
        existing.close(1000, "Connection replaced");
      }
      this.clients.delete(userId);
      console.log(
        `🗑️ User ${userId} removed. Total clients: ${this.clients.size}`,
      );
    }
  }

  // ✅ CORRECT: Get specific user
  getClient(userId: string): ExtendedWebSocket | undefined {
    const client = this.clients.get(userId);

    // Verify connection is still alive
    if (client && client.readyState === WebSocket.OPEN) {
      return client;
    }

    // Clean up stale connection
    if (client) {
      this.clients.delete(userId);
    }
    return undefined;
  }

  // Add debugging method
  logConnectedUsers(): void {
    // Only log in debug mode - use environment variable if needed
    const enableDebug = env.ENABLE_WEBSOCKET_DEBUG === "true";

    if (enableDebug) {
      console.log("==========================================");
      console.log("📊 Currently connected users:");
      this.clients.forEach((client, userId) => {
        console.log(`👤 ${userId} - Connection state: ${client.readyState}`);
      });
      console.log("==========================================");
    }
  }

  // ✅ CORRECT: Send all the message to the clients
  broadcastToUser({
    receiverId,
    message,
  }: {
    receiverId: string;
    message: string;
  }): boolean {
    const client = this.clients.get(receiverId);

    if (!client) {
      console.log(`❌ User ${receiverId} not found in connected clients`);
      return false;
    }

    if (client.readyState !== WebSocket.OPEN) {
      console.log(
        `❌ User:receiver ${receiverId} connection is not open (state: ${client.readyState})`,
      );
      this.clients.delete(receiverId); // Clean up stale connection
      return false;
    }

    try {
      client.send(message);
      // Success - no need to log every message send
      return true;
    } catch (error) {
      console.error(`❌ Error sending to user ${receiverId}:`, error);
      this.clients.delete(receiverId); // Clean up broken connection
      return false;
    }
  }

  // Broadcast message to multiple users
  broadcastToMultipleUsers({
    receiverIds,
    message,
  }: {
    receiverIds: string[];
    message: string;
  }): number {
    let successCount = 0;

    receiverIds.forEach((receiverId) => {
      const sent = this.broadcastToUser({ receiverId, message });
      if (sent) {
        successCount++;
      }
    });

    console.log(
      `📡 Broadcast complete. Message sent to ${successCount} out of ${receiverIds.length} users.`,
    );

    return successCount;
  }

  // Get total connected clients\
  getClientCount(): number {
    return this.clients.size;
  }

  cleanupStaleConnections(): void {
    let staleCount = 0;
    this.clients.forEach((client, userId) => {
      if (client.readyState !== WebSocket.OPEN) {
        this.clients.delete(userId);
        staleCount++;
      }
    });
    if (staleCount > 0) {
      console.log(`🧹 Cleaned up ${staleCount} stale connections`);
    }
  }

  // Clean up all connections
  cleanupAll(): void {
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1000, "Server shutdown");
      }
    });
    this.clients.clear();
    console.log("🧹 All WebSocket connections cleaned up");
  }
}

// Singleton instance
export const clientManager = new ClientManager();
