// src/utils/cacheHelpers.ts
import redisClient from "../config/redisClient";

// Cache statistics for monitoring

// Get data from cache
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, skipping cache read");
      return null;
    }

    const cachedData = await redisClient.get(key);

    if (cachedData) {
      console.log(`✅ Cache hit for key: ${key}`);
      return JSON.parse(cachedData);
    } else {
      console.log(`❌ Cache miss for key: ${key}`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading from cache (key: ${key}):`, error);
    return null;
  }
};

// Set data in cache with TTL
export const setCachedData = async (
  key: string,
  data: any,
  ttlSeconds: number = 300,
): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, skipping cache write");
      return;
    }
    await redisClient.set(key, JSON.stringify(data), {
      expiration: {
        type: "EX",
        value: ttlSeconds,
      },
    });
    console.log(`✅ Data cached for key: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`Error writing to cache (key: ${key}):`, error);
  }
};

// Delete cached data
export const deleteCachedData = async (key: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, skipping cache deletion");
      return;
    }

    await redisClient.del(key);
    console.log(`✅ Cache deleted for key: ${key}`);
  } catch (error) {
    console.error(`Error deleting from cache (key: ${key}):`, error);
  }
};
