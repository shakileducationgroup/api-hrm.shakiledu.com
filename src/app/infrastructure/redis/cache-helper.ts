import { redisCache } from "./redis.utils";

class RedisHelper {
  constructor() {}

  /**
   * Small helper wrapper around redisCache to centralize try/catch, logging and TTL handling.
   */
  async safeSet<T>(key: string, value: T, ttlInSeconds: number): Promise<void> {
    try {
      await redisCache.set(key, value, ttlInSeconds);
    } catch (error) {
      console.error(
        "🐛 [Redis][safeSet] Error setting key:",
        key,
        (error as Error).message,
      );
    }
  }

  /**
   * Small helper wrapper around redisCache to centralize try/catch, logging and TTL handling.
   */
  async safeGet<T>(key: string): Promise<T | null> {
    try {
      return await redisCache.get<T>(key);
    } catch (error) {
      console.error(
        "🐛 [Redis][safeGet] Error reading key:",
        key,
        (error as Error).message,
      );
      return null;
    }
  }

  async safeDel(key: string): Promise<void> {
    try {
      await redisCache.del(key);
    } catch (error) {
      console.error(
        "🐛 [Redis][safeDel] Error deleting key:",
        key,
        (error as Error).message,
      );
    }
  }

  /**
   * getOrSet: Try to get value from redis, if missing call `fetcher` to produce the value,
   * set it in redis with provided TTL and return the value.
   */

  async getOrSet<T>(
    key: string,
    ttlInSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    // try get
    const cached = await this.safeGet<T>(key);
    if (cached) {
      console.log(`🐛 [Redis][getOrSet] Cache HIT for key: ${key}`);
      return cached;
    }

    console.log(
      `🐛 [Redis][getOrSet] Cache MISS for key: ${key}. Fetching from DB...`,
    );
    const data = await fetcher();

    // set but don't throw on error
    await this.safeSet<T>(key, data, ttlInSeconds);
    return data;
  }
}

export const redisHelper = new RedisHelper();
