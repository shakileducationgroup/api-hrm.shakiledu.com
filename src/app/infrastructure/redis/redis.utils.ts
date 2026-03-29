import { Redis as RedisClient } from "ioredis";
import { redis } from "../../config/redis-connection";

export class RedisCache {
  private client: RedisClient;
  private isConnected: boolean = false;

  constructor() {
    this.client = redis;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on("connect", () => {
      console.log("Redis client connected");
      this.isConnected = true;
    });

    this.client.on("ready", () => {
      console.log("Redis client ready");
      this.isConnected = true;
    });

    this.client.on("error", (err) => {
      console.error("Redis client error:", err);
      this.isConnected = false;
    });

    this.client.on("close", () => {
      console.log("Redis client disconnected");
      this.isConnected = false;
    });

    this.client.on("reconnecting", () => {
      console.log("Redis client reconnecting");
    });
  }

  // Ensure connection is established
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected && this.client.status !== "connecting") {
      try {
        await this.client.connect();
      } catch (error) {
        console.error("Failed to connect to Redis:", error);
      }
    }
  }

  // Set value with optional expiration (in seconds)
  async set(key: string, value: any, expireInSeconds?: number): Promise<void> {
    try {
      await this.ensureConnection();
      const serializedValue = JSON.stringify(value);

      if (expireInSeconds) {
        await this.client.setex(key, expireInSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.error("Redis set error:", error);
      throw error;
    }
  }

  // Get value by key
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      const value = await this.client.get(key);

      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  // Delete key
  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.del(key);
    } catch (error) {
      console.error("Redis delete error:", error);
      throw error;
    }
  }

  // Delete multiple keys by pattern
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      await this.ensureConnection();

      // ioredis supports scanning with patterns
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      const keysToDelete: string[] = [];

      return new Promise((resolve, reject) => {
        stream.on("data", (keys: string[]) => {
          if (keys.length) {
            keysToDelete.push(...keys);
          }
        });

        stream.on("end", async () => {
          if (keysToDelete.length > 0) {
            await this.client.del(...keysToDelete);
            console.log(
              `Deleted ${keysToDelete.length} keys with pattern: ${pattern}`,
            );
          }
          resolve();
        });

        stream.on("error", reject);
      });
    } catch (error) {
      console.error("Redis delete by pattern error:", error);
      throw error;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Redis exists error:", error);
      return false;
    }
  }

  // Set expiration for key
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error("Redis expire error:", error);
      throw error;
    }
  }

  // Get time to live for key
  async ttl(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Redis TTL error:", error);
      return -2; // Key doesn't exist
    }
  }

  // Flush all data (use with caution)
  async flushAll(): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.flushall();
    } catch (error) {
      console.error("Redis flush all error:", error);
      throw error;
    }
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      await this.ensureConnection();
      const values = await this.client.mget(...keys);
      return values.map((value) => (value ? (JSON.parse(value) as T) : null));
    } catch (error) {
      console.error("Redis mget error:", error);
      return [];
    }
  }

  // Set multiple key-value pairs
  async mset(
    keyValuePairs: [string, any][],
    expireInSeconds?: number,
  ): Promise<void> {
    try {
      await this.ensureConnection();
      const pipeline = this.client.pipeline();

      keyValuePairs.forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (expireInSeconds) {
          pipeline.setex(key, expireInSeconds, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });

      await pipeline.exec();
    } catch (error) {
      console.error("Redis mset error:", error);
      throw error;
    }
  }

  // Close connection
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
      }
    } catch (error) {
      console.error("Redis disconnect error:", error);
    }
  }

  // Get Redis connection status
  getStatus(): string {
    return this.client.status;
  }

  // Acquire distributed lock
  async acquireLock(
    lockKey: string,
    lockValue: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.set(
        lockKey,
        lockValue,
        "EX",
        ttlSeconds,
        "NX",
      );
      return result === "OK";
    } catch (error) {
      console.error("Lock acquisition error:", error);
      return false;
    }
  }

  // Release distributed lock
  async releaseLock(lockKey: string, lockValue: string): Promise<void> {
    try {
      await this.ensureConnection();
      const currentValue = await this.client.get(lockKey);
      if (currentValue === lockValue) {
        await this.client.del(lockKey);
      }
    } catch (error) {
      console.error("Lock release error:", error);
    }
  }
}

// Singleton instance
export const redisCache = new RedisCache();
