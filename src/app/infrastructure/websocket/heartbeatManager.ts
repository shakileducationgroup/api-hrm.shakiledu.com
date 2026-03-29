import { WebSocket } from "ws";
import env from "../../config/clean-env";

interface HeartbeatStats {
  pingCount: number;
  pongCount: number;
  clientId: string;
  lastPong: number;
}

export class HeartbeatManager {
  private connections: Map<WebSocket, HeartbeatStats> = new Map();

  // Interval reference
  private interval: NodeJS.Timeout | null = null;

  // Configurable timings via env with safe defaults
  private readonly heartbeatInterval =
    Number(env.HEARTBEAT_INTERVAL_MS) || 30000; // 30s

  // Timeout threshold to consider a connection dead
  private readonly timeoutThreshold =
    Number(env.HEARTBEAT_TIMEOUT_MS) ||
    Math.floor(this.heartbeatInterval * 2.5); // ~75s

  // Logging controls
  private readonly enableDebug = env.ENABLE_HEARTBEAT_DEBUG === "true";

  // Logging controls for pong messages
  private readonly pongLogSampleN = Number(env.HEARTBEAT_PONG_SAMPLE_N) || 100; // log every Nth pong

  // Timestamp of last cycle log
  private lastCycleLogTs = 0;

  constructor() {
    this.startGlobalHeartbeat();
  }

  addConnection(ws: WebSocket): string {
    const clientId = Math.random().toString(36).substr(2, 9);
    const now = Date.now();

    this.connections.set(ws, {
      pingCount: 0,
      pongCount: 0,
      clientId,
      lastPong: now,
    });

    // console.log(`🚀 Heartbeat monitoring started for client ${clientId}`);

    // Setup event listeners
    ws.on("pong", (data) => this.handlePong(ws, data));
    ws.on("close", () => this.removeConnection(ws));
    ws.on("error", () => this.removeConnection(ws));

    // Send initial ping after a short delay
    setTimeout(() => this.sendPing(ws), 1000);

    return clientId;
  }

  removeConnection(ws: WebSocket): void {
    const stats = this.connections.get(ws);
    if (stats) {
      if (this.enableDebug) {
        console.log(`🔌 Removing heartbeat for client ${stats.clientId}`);
        console.log(
          `📊 Final stats: Pings: ${stats.pingCount}, Pongs: ${stats.pongCount}`,
        );
      }
      this.connections.delete(ws);
    }
  }

  private startGlobalHeartbeat(): void {
    this.interval = setInterval(() => {
      this.checkConnections();
    }, this.heartbeatInterval);
  }

  private checkConnections(): void {
    const now = Date.now();

    this.connections.forEach((stats, ws) => {
      if (now - stats.lastPong > this.timeoutThreshold) {
        console.log(`💀 Client ${stats.clientId} timeout - terminating`);
        this.terminateConnection(ws, stats);
      } else {
        // add small jitter to avoid thundering herd
        const jitterMs = Math.floor(Math.random() * 1000); // 0-1s
        setTimeout(() => this.sendPing(ws), jitterMs);
      }
    });

    if (this.enableDebug) {
      const nowTs = Date.now();
      if (nowTs - this.lastCycleLogTs >= this.heartbeatInterval) {
        console.log(
          `🔄 Heartbeat cycle: ${this.connections.size} connections monitored`,
        );
        this.lastCycleLogTs = nowTs;
      }
    }
  }

  private sendPing(ws: WebSocket): void {
    const stats = this.connections.get(ws);
    if (!stats || ws.readyState !== WebSocket.OPEN) {
      this.removeConnection(ws);
      return;
    }

    stats.pingCount++;
    //console.log(`📤 Ping #${stats.pingCount} to client ${stats.clientId}`);

    try {
      ws.ping(`sending-ping-${stats.pingCount}-${Date.now()}...`);
    } catch (error) {
      console.error(`❌ Error pinging client ${stats.clientId}:`, error);
      this.removeConnection(ws);
    }
  }

  private handlePong(ws: WebSocket, data: Buffer): void {
    const stats = this.connections.get(ws);
    if (!stats) return;

    stats.pongCount++;
    stats.lastPong = Date.now();
    const pingData = data ? data.toString() : "no data";

    if (this.enableDebug && stats.pongCount % this.pongLogSampleN === 0) {
      console.log(
        `📥 Pong #${stats.pongCount} from ${stats.clientId}, Data: ${pingData}`,
      );
    }
  }

  private terminateConnection(ws: WebSocket, stats: HeartbeatStats): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.terminate();
      }
    } catch (error) {
      console.error(`Error terminating connection ${stats.clientId}:`, error);
    } finally {
      this.removeConnection(ws);
    }
  }

  getStats(): {
    totalConnections: number;
    connections: Map<WebSocket, HeartbeatStats>;
  } {
    return {
      totalConnections: this.connections.size,
      connections: new Map(this.connections), // Return a copy
    };
  }

  cleanup(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.connections.forEach((stats, ws) => {
      this.terminateConnection(ws, stats);
    });

    if (this.enableDebug) {
      console.log("✅ Heartbeat manager cleaned up");
    }
  }
}

export const heartbeatManager = new HeartbeatManager();
