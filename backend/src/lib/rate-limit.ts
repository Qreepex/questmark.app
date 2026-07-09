import type { ClientContext, Result } from "ioredis";
import redis from "../cache/client.js";

export interface RateLimitRule {
  windowSeconds: number;
  maxRequests: number;
  banSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

declare module "ioredis" {
  interface RedisCommander<Context> {
    rateLimitCheck(
      numkeys: number,
      ...args: Array<string | number>
    ): Result<[number, number], Context>;
  }
}

// KEYS[1] is the ban key, KEYS[2..] are one count key per rule (same order as
// the ARGV rule triples). Each rule is checked in order; the first one that is
// exceeded bans the scope for its configured duration.
const RATE_LIMIT_SCRIPT = `
local banKey = KEYS[1]
if redis.call("EXISTS", banKey) == 1 then
  return {0, redis.call("PTTL", banKey)}
end

local ruleCount = #KEYS - 1
for i = 1, ruleCount do
  local countKey = KEYS[i + 1]
  local window = tonumber(ARGV[(i - 1) * 3 + 1])
  local max = tonumber(ARGV[(i - 1) * 3 + 2])
  local banSeconds = tonumber(ARGV[(i - 1) * 3 + 3])

  local count = redis.call("INCR", countKey)
  if count == 1 then
    redis.call("EXPIRE", countKey, window)
  end

  if count > max then
    redis.call("SET", banKey, "1", "EX", banSeconds)
    return {0, banSeconds * 1000}
  end
end

return {1, 0}
`;

redis.defineCommand("rateLimitCheck", { lua: RATE_LIMIT_SCRIPT });

export async function checkRateLimit(
  scopeKey: string,
  rules: RateLimitRule[],
): Promise<RateLimitResult> {
  const banKey = `ratelimit:${scopeKey}:ban`;
  const countKeys = rules.map(
    (rule) => `ratelimit:${scopeKey}:c${rule.windowSeconds}`,
  );
  const keys = [banKey, ...countKeys];
  const args = rules.flatMap((rule) => [
    rule.windowSeconds,
    rule.maxRequests,
    rule.banSeconds,
  ]);

  const [allowed, retryAfterMs] = await redis.rateLimitCheck(
    keys.length,
    ...keys,
    ...args,
  );

  return { allowed: allowed === 1, retryAfterMs };
}
