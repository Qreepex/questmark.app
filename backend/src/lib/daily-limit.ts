import type { Result } from "ioredis";
import redis from "../cache/client.js";

declare module "ioredis" {
  interface RedisCommander<Context> {
    consumeDailyQuota(
      key: string,
      limit: number,
      ttlSeconds: number,
    ): Result<number, Context>;
  }
}

// Atomically increments `key` and reports whether it was still under `limit`
// *before* this call. Only increments when there's room, so a run of denied
// callers doesn't push the counter past `limit`. State lives in Redis so the
// quota is shared across all requests/processes.
const CONSUME_DAILY_QUOTA_SCRIPT = `
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local limit = tonumber(ARGV[1])

if current >= limit then
  return 0
end

redis.call("INCR", KEYS[1])
redis.call("EXPIRE", KEYS[1], ARGV[2])
return 1
`;

redis.defineCommand("consumeDailyQuota", {
  numberOfKeys: 1,
  lua: CONSUME_DAILY_QUOTA_SCRIPT,
});

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Enforces a shared daily request budget for `key`, resetting at UTC
 * midnight. Throws once `limit` requests have been consumed for the current
 * day.
 */
export async function consumeDailyQuota(
  key: string,
  limit: number,
): Promise<void> {
  const dailyKey = `daily-quota:${key}:${todayUtc()}`;
  // Keep the counter around a bit past the day boundary so clock skew across
  // processes can't reset it early.
  const ttlSeconds = 60 * 60 * 48;

  const allowed = await redis.consumeDailyQuota(dailyKey, limit, ttlSeconds);

  if (!allowed) {
    throw new Error(`Daily quota exceeded for "${key}" (limit ${limit})`);
  }
}
