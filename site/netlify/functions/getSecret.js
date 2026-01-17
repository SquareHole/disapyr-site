import { neon } from '@netlify/neon';
import { checkRateLimit } from './_lib/rateLimit';
import { assertEnv } from './_lib/assertEnv';
import { decryptSecret } from './_lib/crypto';


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

    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!key || !uuidV4.test(key)) {
      return new Response(JSON.stringify({ error: 'Key parameter is required and must be a valid UUID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for encryption key
    const encryptionKey = process.env.NETLIFY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('NETLIFY_ENCRYPTION_KEY environment variable not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Neon connection (automatically uses NETLIFY_DATABASE_URL)
    const sql = neon();

    // First, check if the secret exists and hasn't been retrieved yet
    const [secret] = await sql`
      SELECT key, secret, expires_at, retrieved_at 
      FROM secrets 
      WHERE key = ${key} AND retrieved_at IS NULL AND secret IS NOT NULL
    `;

    if (!secret) {
      return new Response(JSON.stringify({ error: 'Secret not found or already retrieved' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if the secret has expired
    const now = new Date();
    if (secret.expires_at && new Date(secret.expires_at) < now) {
      return new Response(JSON.stringify({ error: 'Secret has expired' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Decrypt the secret
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

    // Soft-delete: mark as retrieved and nullify content to prevent re-access, preserve audit
    await sql`
      UPDATE secrets 
      SET retrieved_at = ${now.toISOString()}, secret = NULL
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
