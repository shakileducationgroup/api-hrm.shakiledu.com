import { Redis } from "ioredis";
import env from "./clean-env";

/**
 * Redis Publisher - For publishing events to channels
 * Can also perform other Redis operations (GET, SET, etc.)
 */
const redisPublisher = new Redis({
  host: env.REDIS_URL,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

/**
 * Redis Subscriber - For subscribing to channels (subscription-only mode)
 * Cannot perform other Redis operations while in subscription mode
 */
const redisSubscriber = new Redis({
  host: env.REDIS_URL,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

/**
 * Redis Cache - For caching operations (GET, SET, DEL, etc.)
 * General purpose caching client
 */
const redis = new Redis({
  host: env.REDIS_URL,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Event listeners for debugging
redisPublisher.on("connect", () => console.log("✅ Redis Publisher connected"));
redisPublisher.on("error", (err) =>
  console.error("❌ Redis Publisher error:", err),
);

redisSubscriber.on("connect", () =>
  console.log("✅ Redis Subscriber connected"),
);
redisSubscriber.on("error", (err) =>
  console.error("❌ Redis Subscriber error:", err),
);

redis.on("connect", () => console.log("✅ Redis Cache connected"));
redis.on("error", (err) => console.error("❌ Redis Cache error:", err));

// Default export (for backward compatibility with existing code)
export { redis, redisPublisher, redisSubscriber };
