import { logger } from "..";
import redisClient from "../config/redis.config";

class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isOpen) {
        logger.warn("Redis not connected, skipping cache read");
        return null;
      }

      const cachedData = await redisClient.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      logger.error(`Cache read error for key ${key}:`, error);
      return null;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: any data can be there
  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        logger.warn("Redis not connected, skipping cache write");
        return;
      }

      await redisClient.set(key, JSON.stringify(data), {
        expiration: { type: "EX", value: ttlSeconds },
      });
    } catch (error) {
      logger.error(`Cache write error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        logger.warn("Redis not connected, skipping cache deletion");
        return;
      }

      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
