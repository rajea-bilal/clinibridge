type RateLimitState = {
  count: number;
  resetMs: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitState>();

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetMs <= now) {
    const resetMs = now + windowMs;
    buckets.set(key, { count: 1, resetMs });
    return {
      ok: true,
      remaining: limit - 1,
      limit,
      resetMs,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      limit,
      resetMs: existing.resetMs,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetMs - now) / 1000)
      ),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    ok: true,
    remaining: limit - existing.count,
    limit,
    resetMs: existing.resetMs,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetMs - now) / 1000)),
  };
}
