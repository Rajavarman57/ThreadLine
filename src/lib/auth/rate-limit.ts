import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory sliding window fallback store
const inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

function inMemoryRateLimit(identifier: string, limit = 5, windowSeconds = 60): { success: boolean; reset: number } {
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  if (!entry || now > entry.expiresAt) {
    inMemoryStore.set(identifier, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { success: true, reset: now + windowSeconds * 1000 };
  }

  if (entry.count >= limit) {
    return { success: false, reset: entry.expiresAt };
  }

  entry.count += 1;
  return { success: true, reset: entry.expiresAt };
}

let upstashRatelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "threadline_ratelimit",
    });
  } catch (err) {
    console.warn("Failed to initialize Upstash Redis, falling back to memory:", err);
  }
}

/**
 * Enforces rate limiting on authentication attempts.
 * Returns { success: boolean, reset: number }.
 */
export async function checkLoginRateLimit(identifier: string): Promise<{ success: boolean; reset: number }> {
  if (upstashRatelimit) {
    try {
      const res = await upstashRatelimit.limit(identifier);
      return { success: res.success, reset: res.reset };
    } catch {
      return inMemoryRateLimit(identifier);
    }
  }
  return inMemoryRateLimit(identifier);
}
