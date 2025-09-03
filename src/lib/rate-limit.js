// Basic token bucket per-IP per-route for dev/small scale (resets on server restart)
const buckets = new Map();

function keyFor(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  const path = new URL(req.url).pathname;
  return `${ip}:${path}`;
}

/**
 * rateLimit(request, { limit, window })
 *   limit  - max requests per window
 *   window - ms window (e.g., 60000)
 */
export async function rateLimit(req, { limit = 60, window = 60_000 } = {}) {
  const key = keyFor(req);
  const now = Date.now();

  let entry = buckets.get(key);
  if (!entry) {
    entry = { count: 1, reset: now + window };
    buckets.set(key, entry);
    return { ok: true, remaining: limit - 1, reset: entry.reset };
  }

  if (now > entry.reset) {
    entry.count = 1;
    entry.reset = now + window;
    return { ok: true, remaining: limit - 1, reset: entry.reset };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, reset: entry.reset };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, reset: entry.reset };
}
