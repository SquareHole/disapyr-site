import { neon } from '@netlify/neon';
import { checkRateLimit } from './_lib/rateLimit';
import { assertEnv } from './_lib/assertEnv';
import { decryptSecret } from './_lib/crypto';
import { isUuidV4 } from './_lib/validate';


export default async (req) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Fail fast if required env is missing/invalid
    assertEnv();

    // Rate limit: e.g., 60 retrieval attempts per IP per 5 minutes
    const rl = await checkRateLimit(req, { key: 'getSecret', limit: 60, windowSeconds: 300 });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...rl.headers },
      });
    }

    // Get the key from query parameters and validate format (UUID v4)
    const url = new URL(req.url);
    const key = url.searchParams.get('key');

    if (!key || !isUuidV4(key)) {
      return new Response(JSON.stringify({ error: 'Key parameter is required and must be a valid UUID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encryptionKey = process.env.NETLIFY_ENCRYPTION_KEY;
    const sql = neon();
    const now = new Date();

    // Atomic UPDATE...RETURNING: marks the secret as retrieved only if it exists,
    // hasn't already been retrieved, and hasn't expired. Prevents TOCTOU race conditions
    // that would allow a secret to be read more than once.
    const [secret] = await sql`
      UPDATE secrets
      SET retrieved_at = ${now.toISOString()}
      WHERE key = ${key}
        AND retrieved_at IS NULL
        AND secret IS NOT NULL
        AND (expires_at IS NULL OR expires_at > ${now.toISOString()})
      RETURNING key, secret, expires_at, retrieved_at
    `;

    if (!secret) {
      return new Response(JSON.stringify({ error: 'Secret not found or already retrieved' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Decrypt the secret before nullifying it in the database
    let decryptedSecret;
    try {
      const encryptedData = JSON.parse(secret.secret);
      decryptedSecret = decryptSecret(encryptedData, encryptionKey);
    } catch (error) {
      console.error('Failed to decrypt secret:', error);
      return new Response(JSON.stringify({ error: 'Failed to retrieve secret' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Nullify the encrypted content — retrieved_at was already set atomically above
    await sql`
      UPDATE secrets
      SET secret = NULL
      WHERE key = ${key}
    `;

    // Return the decrypted secret
    return new Response(JSON.stringify({
      key: secret.key,
      secret: decryptedSecret,
      retrieved_at: now.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...rl.headers }
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
