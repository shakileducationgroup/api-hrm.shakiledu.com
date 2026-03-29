import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import env from "../../config/clean-env";
import { clientManager } from "./clientManager";

import { socketHandler } from "./handler.websocket";
import { heartbeatManager } from "./heartbeatManager";

export type ConnectionCallback = (socket: WebSocket) => void;

class SocketManager {
  private wss: WebSocketServer | null = null;
  private connectionCallbacks: ConnectionCallback[] = [];
  private currentSocket: WebSocket | null = null;
  private isInitialized = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  port = !env.isDev ? env.PORT : env.STAGING_PORT;
  initSocket(server: Server): void {
    if (this.isInitialized) {
      console.warn(
        "=============================== WebSocket server already initialized ===============================",
      );
      return;
    }

    this.wss = new WebSocketServer({
      server,
      perMessageDeflate: false,
    });

    console.log(`🚀 WebSocket server started on ws://localhost:${this.port}`);
    this.isInitialized = true;

    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      clientManager.cleanupStaleConnections();
    }, 60000);

    this.wss.on("connection", (ws: WebSocket) => {
      this.handleNewConnection(ws);
    });

    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  // Handle new client connection
  private handleNewConnection(ws: WebSocket): void {
    console.log("✅ New client connected");
    this.currentSocket = ws;

    // Use the separate heartbeat manager
    heartbeatManager.addConnection(ws);

    // Set up a handler for incoming messages
    this.setupWebSocketHandler(ws);

    // Execute registered callbacks
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(ws);
      } catch (error) {
        console.error("Error in connection callback:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      heartbeatManager.removeConnection(ws);
    });

    ws.on("close", () => {
      console.log("🔌 Client disconnected");
      heartbeatManager.removeConnection(ws);

      if (this.currentSocket === ws) {
        this.currentSocket = null;
      }
    });
  }

  private setupWebSocketHandler(ws: WebSocket): void {
    ws.on("message", async (data: string | Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());

        await socketHandler.decideTheChannel(parsed, ws);
      } catch (err) {
        console.error("❌ Error handling notification:", err);
        this.sendError(ws, err);
      }
    });
  }

  private sendError(ws: WebSocket, error: unknown): void {
    try {
      ws.send(
        JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    } catch (sendError) {
      console.error("Failed to send error message to client:", sendError);
    }
  }

  onConnection(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);

    if (this.currentSocket?.readyState === WebSocket.OPEN) {
      try {
        callback(this.currentSocket);
      } catch (error) {
        console.error("Error executing connection callback:", error);
      }
    }
  }

  getSocket(): WebSocket | null {
    if (
      !this.currentSocket ||
      this.currentSocket.readyState !== WebSocket.OPEN
    ) {
      console.warn("No active WebSocket connection");
      return null;
    }
    return this.currentSocket;
  }

  // Add method to get heartbeat stats
  getHeartbeatStats() {
    return heartbeatManager.getStats();
  }

  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Cleanup heartbeat manager
    heartbeatManager.cleanup();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    clientManager.cleanupAll();
    this.connectionCallbacks = [];
    this.currentSocket = null;
    this.isInitialized = false;

    console.log("✅ WebSocket server closed gracefully");
  }
}

export const socketManager = new SocketManager();
