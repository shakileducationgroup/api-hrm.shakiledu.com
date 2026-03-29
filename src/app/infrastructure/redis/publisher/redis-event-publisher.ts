import { Redis } from "ioredis";
import { redisPublisher } from "../../../config/redis-connection";
import { I_PublishEventParams, I_RedisEventPayload } from "../types/types";

/**
 * Reusable Redis Event Publisher
 * Use this to publish events that will be consumed by subscribers
 */
class RedisEventPublisher {
  private publisher: Redis;

  constructor(redisClient: Redis = redisPublisher) {
    this.publisher = redisClient;
  }

  /**
   * Publish an event to a Redis channel
   * @param channel - The channel name from REDIS_CHANNELS
   * @param data - Event data payload
   * @param notificationCreator - Optional user ID who triggered the event
   * @param notificationRecipient - Optional user ID who is the recipient of the event
   * @param metadata - Optional additional metadata
   */
  async publishEvent<DT, MT>({
    channel,
    data,
    notificationCreator,
    notificationRecipient,
    metadata,
  }: I_PublishEventParams<DT, MT>): Promise<number> {
    try {
      const payload: I_RedisEventPayload<DT, MT> = {
        channel,
        data,
        timestamp: Date.now(),
        notificationCreator,
        notificationRecipient,
        metadata,
      };

      // Publish to channel and get number of subscribers
      const subscribers = await this.publisher.publish(
        channel,
        JSON.stringify(payload),
      );

      console.log(
        `📡 Event published to "${channel}" | Subscribers: ${subscribers}`,
      );

      return subscribers;
    } catch (error) {
      console.error(`❌ Error publishing event to "${channel}":`, error);
      throw error;
    }
  }

  /**
   * Get client connection status
   */
  isConnected(): boolean {
    return this.publisher.status === "ready";
  }

  /**
   * Close the publisher connection
   */
  async disconnect(): Promise<void> {
    await this.publisher.quit();
  }
}

// Export singleton instance
export const redisEventPublisher = new RedisEventPublisher();

export default RedisEventPublisher;
