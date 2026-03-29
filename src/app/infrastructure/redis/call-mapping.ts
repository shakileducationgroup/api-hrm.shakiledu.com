import { redisHelper } from "./cache-helper";
import { redisCache } from "./redis.utils";

interface ICallMapping {
  leadId?: string;
  userId?: string;
  toPhoneNumber?: string;
  fromPhoneNumber?: string;
  createdAt: string;
}

interface IUserSession {
  leadId: string;
  createdAt: string;
  tokenExpiresAt: string;
}

/**
 * Utility to store and retrieve call mapping from Redis
 * Maps CallSid to lead/user information
 * Used to link Twilio callbacks (with CallSid) to lead/user context
 */
export const callMappingService = {
  /**
   * Store call mapping in Redis
   * @param callSid Twilio CallSid
   * @param mapping Call context (leadId, userId, phone numbers)
   * @param ttl Time to live in seconds (default: 1 hour)
   */
  storeCallMapping: async (
    callSid: string,
    mapping: Partial<ICallMapping>,
    ttl: number = 3600,
  ): Promise<void> => {
    try {
      const key = `voip:call:${callSid}`;
      const data: ICallMapping = {
        ...mapping,
        createdAt: new Date().toISOString(),
      };

      await redisHelper.safeSet(key, data, ttl);
    } catch (error) {
      console.error(`❌ Error storing call mapping for ${callSid}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve call mapping from Redis
   * @param callSid Twilio CallSid
   * @returns Call context or null if not found
   */
  getCallMapping: async (callSid: string): Promise<ICallMapping | null> => {
    try {
      const key = `voip:call:${callSid}`;
      const data = await redisHelper.safeGet<ICallMapping>(key);

      if (!data) {
        console.warn(`⚠️ No call mapping found for ${callSid}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`❌ Error retrieving call mapping for ${callSid}:`, error);
      return null;
    }
  },

  /**
   * Delete call mapping from Redis
   * @param callSid Twilio CallSid
   */
  deleteCallMapping: async (callSid: string): Promise<void> => {
    try {
      const key = `voip:call:${callSid}`;
      await redisHelper.safeDel(key);
    } catch (error) {
      console.error(`❌ Error deleting call mapping for ${callSid}:`, error);
    }
  },

  /**
   * Get all active calls for a user
   * @param userId User ID
   * @returns Array of active call mappings
   */
  getUserActiveCalls: async (userId: string): Promise<ICallMapping[]> => {
    try {
      // Use redisCache client directly for SCAN operation
      const pattern = `voip:call:*`;
      const keys: string[] = [];

      // ioredis SCAN using async iteration
      let cursor = "0";
      do {
        const [nextCursor, results] = await redisCache["client"].scan(
          cursor,
          "MATCH",
          pattern,
        );
        cursor = nextCursor;
        keys.push(...results);
      } while (cursor !== "0");

      const activeCalls: ICallMapping[] = [];

      for (const key of keys) {
        const data = await redisHelper.safeGet<ICallMapping>(key);
        if (data && data.userId === userId) {
          activeCalls.push(data);
        }
      }

      return activeCalls;
    } catch (error) {
      console.error(`❌ Error getting user active calls for ${userId}:`, error);
      return [];
    }
  },

  /**
   * Store user session in Redis when token is generated
   * @param userId User ID
   * @param session User session metadata (createdAt, tokenExpiresAt)
   * @param ttl Time to live in seconds (default: 1 hour)
   */
  storeUserSession: async (
    userId: string,
    session: IUserSession,
    ttl: number = 3600,
  ): Promise<void> => {
    try {
      const key = `voip:user:${userId}`;
      await redisHelper.safeSet(key, session, ttl);
    } catch (error) {
      console.error(`❌ Error storing user session for ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve user session from Redis
   * @param userId User ID
   * @returns User session or null if not found
   */
  getUserSession: async (userId: string): Promise<IUserSession | null> => {
    try {
      const key = `voip:user:${userId}`;
      const session = await redisHelper.safeGet<IUserSession>(key);

      if (!session) {
        console.warn(`⚠️ No user session found for ${userId}`);
        return null;
      }

      return session;
    } catch (error) {
      console.error(`❌ Error retrieving user session for ${userId}:`, error);
      return null;
    }
  },
};
