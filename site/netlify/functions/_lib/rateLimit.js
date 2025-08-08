import { neon } from '@netlify/neon';

function getClientIp(req) {
  try {
    const xfwd = req.headers.get('x-forwarded-for');
    if (xfwd) return xfwd.split(',')[0].trim();
    const netlifyIp = req.headers.get('x-nf-client-connection-ip');
    if (netlifyIp) return netlifyIp.trim();
  } catch {}
  return 'unknown';
}

/**
 * Check per-IP rate limit in a fixed window.
 * - key: logical bucket (e.g., 'createSecret', 'getSecret')
 * - limit: number allowed per windowSeconds
 * - windowSeconds: size of window
 * Returns { allowed, limit, remaining, resetEpoch, headers }
 */
export async function checkRateLimit(req, { key, limit, windowSeconds }) {
  // No-op in test environments so unit tests remain stable
  if (process.env.NODE_ENV === 'test') {
    const resetEpoch = Math.floor(Date.now() / 1000) + windowSeconds;
    const remaining = limit - 1; // assume one usage
    return {
      allowed: true,
      limit,
      remaining: remaining < 0 ? 0 : remaining,
      resetEpoch,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining < 0 ? 0 : remaining),
        'X-RateLimit-Reset': String(resetEpoch),
      },
    };
  }

  const ip = getClientIp(req);
  const sql = neon();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // Ensure table exists (idempotent)
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip TEXT NOT NULL,
      key TEXT NOT NULL,
      ts TIMESTAMP NOT NULL
    );
  `;

  // Prune old entries to keep table small
  await sql`
    DELETE FROM rate_limits WHERE ts < ${windowStart.toISOString()}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM rate_limits
    WHERE ip = ${ip} AND key = ${key} AND ts >= ${windowStart.toISOString()}
  `;

  const resetEpoch = Math.floor((windowStart.getTime() + windowSeconds * 1000) / 1000);

  if (count >= limit) {
    const headers = {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(resetEpoch),
      'Retry-After': String(Math.max(1, Math.floor((windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000))),
    };
    return { allowed: false, limit, remaining: 0, resetEpoch, headers };
  }

  // Record this request
  await sql`
    INSERT INTO rate_limits (ip, key, ts)
    VALUES (${ip}, ${key}, ${now.toISOString()})
  `;

  const remaining = Math.max(0, limit - (count + 1));
  const headers = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetEpoch),
  };
  return { allowed: true, limit, remaining, resetEpoch, headers };
}
