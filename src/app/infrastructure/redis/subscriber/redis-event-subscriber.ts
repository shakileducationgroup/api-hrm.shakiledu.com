import { Redis } from "ioredis";
import { redisSubscriber } from "../../../config/redis-connection";

import { leadEventHandler } from "../../subscriber/handlers/lead.handler";

import { taskEventHandler } from "../../subscriber/handlers/task.handler";
import {
  getAllChannels,
  REDIS_CHANNELS,
  T_EventHandler,
} from "../channels/channels";
import { I_RedisEventPayload, T_RedisChannel } from "../types/types";

/**
 * Redis Event Subscriber
 * Listens to all Redis channels and routes events to appropriate handlers
 */
class RedisEventSubscriber {
  private subscriber: Redis;
  private handlers: Map<string, T_EventHandler> = new Map();
  private isSubscribed: boolean = false;

  constructor(redisClient: Redis = redisSubscriber) {
    this.subscriber = redisClient;
    this.setupEventListeners();
  }

  /**
   * Setup Redis event listeners
   */
  private setupEventListeners() {
    // Listen for messages
    this.subscriber.on("message", async (channel, message) => {
      try {
        const payload: I_RedisEventPayload<any, any> = JSON.parse(message);

        console.log(
          `📨 Event received on "${channel}" | Type: ${payload.channel}`,
        );

        // Route to appropriate handler based on channel
        await this.handleEvent(channel as T_RedisChannel, payload);
      } catch (error) {
        console.error(`❌ Error processing event from "${channel}":`, error);
      }
    });

    // Listen for subscription events
    this.subscriber.on("subscribe", (channel, count) => {
      console.log(
        `✅ Subscribed to "${channel}" | Total subscriptions: ${count}`,
      );
    });

    // Listen for unsubscribe events
    this.subscriber.on("unsubscribe", (channel, count) => {
      console.log(
        `🔕 Unsubscribed from "${channel}" | Total subscriptions: ${count}`,
      );
    });

    // Handle errors
    this.subscriber.on("error", (error) => {
      console.error("❌ Redis Subscriber Error:", error);
    });
  }

  /**
   * Register a custom handler for a specific channel
   */
  registerHandler(channel: T_RedisChannel, handler: T_EventHandler): void {
    this.handlers.set(channel, handler);
    console.log(`📍 Handler registered for channel: "${channel}"`);
  }

  /**
   * Route event to appropriate handler
   */
  private async handleEvent<DT, MT>(
    channel: T_RedisChannel,
    payload: I_RedisEventPayload<DT, MT>,
  ): Promise<void> {
    try {
      // Route to built-in handlers
      switch (channel) {
        case REDIS_CHANNELS.LEAD_CREATED:
        case REDIS_CHANNELS.LEAD_UPDATED:
        case REDIS_CHANNELS.LEAD_ASSIGNED:
        case REDIS_CHANNELS.LEAD_BULK_ASSIGNED:
        case REDIS_CHANNELS.LEAD_UNASSIGNED:
        case REDIS_CHANNELS.LEAD_STATUS_CHANGED:
          await leadEventHandler(payload);
          break;

        // case REDIS_CHANNELS.NOTIFICATION_CREATED:
        // case REDIS_CHANNELS.NOTIFICATION_SENT:
        //   await notificationEventHandler(payload);
        //   break;

        case REDIS_CHANNELS.TASK_CREATED:
        case REDIS_CHANNELS.TASK_UPDATED:
        case REDIS_CHANNELS.TASK_COMPLETED:
        case REDIS_CHANNELS.TASK_ASSIGNED:
        case REDIS_CHANNELS.TASK_REMINDER:
          await taskEventHandler(payload);
          break;

        default:
          // Check for custom registered handlers
          const customHandler = this.handlers.get(channel);
          if (customHandler) {
            await customHandler(payload);
          } else {
            console.warn(`⚠️ No handler found for channel: "${channel}"`);
          }
      }
    } catch (error) {
      console.error(`❌ Error in event handler for "${channel}":`, error);
      // TODO: Store failed events to DB for retry
    }
  }

  /**
   * Subscribe to all channels
   */
  async subscribeToAllChannels(): Promise<void> {
    if (this.isSubscribed) {
      console.warn("Already subscribed to channels");
      return;
    }

    try {
      const channels = getAllChannels();
      await this.subscriber.subscribe(...channels);
      this.isSubscribed = true;
      console.log(`🗼 Subscribed to ${channels.length} channels`);
    } catch (error) {
      console.error("❌ Error subscribing to channels:", error);
      throw error;
    }
  }

  /**
   * Subscribe to specific channels
   */
  async subscribeToChannels(...channels: T_RedisChannel[]): Promise<void> {
    try {
      await this.subscriber.subscribe(...channels);
      this.isSubscribed = true;
      console.log(`🗼 Subscribed to channels: ${channels.join(", ")}`);
    } catch (error) {
      console.error("❌ Error subscribing to channels:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from specific channels
   */
  async unsubscribeFromChannels(...channels: string[]): Promise<void> {
    try {
      await this.subscriber.unsubscribe(...channels);
      console.log(`🔕 Unsubscribed from channels: ${channels.join(", ")}`);
    } catch (error) {
      console.error("❌ Error unsubscribing from channels:", error);
      throw error;
    }
  }

  /**
   * Get subscription status
   */
  isActive(): boolean {
    return this.isSubscribed && this.subscriber.status === "ready";
  }

  /**
   * Close subscriber connection
   */
  async disconnect(): Promise<void> {
    await this.subscriber.quit();
    this.isSubscribed = false;
  }
}

// Export singleton instance
export const redisEventSubscriber = new RedisEventSubscriber();

export default RedisEventSubscriber;
