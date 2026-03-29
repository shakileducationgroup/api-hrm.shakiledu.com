import { REDIS_CHANNELS } from "../channels/channels";

/**
 * Structured event payload for Redis pub/sub
 */

export interface I_PublishEventParams<DT, MT> {
  channel: T_RedisChannel;
  data: DT; // data type
  notificationCreator?: string;
  notificationRecipient?: string | string[];
  metadata?: MT; // metadata type
}

export interface I_RedisEventPayload<T, M> extends I_PublishEventParams<T, M> {
  timestamp: number;
}

export type T_RedisChannel =
  (typeof REDIS_CHANNELS)[keyof typeof REDIS_CHANNELS];
