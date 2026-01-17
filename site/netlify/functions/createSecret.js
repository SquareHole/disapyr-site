import { neon } from '@netlify/neon';
import { checkRateLimit } from './_lib/rateLimit';
import { randomUUID } from 'crypto';
import { assertEnv } from './_lib/assertEnv';
import { encryptSecret } from './_lib/crypto';

export default async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fail fast if required env is missing/invalid
  assertEnv();

  // Require JSON content-type for POSTs
  const contentType = (req.headers && req.headers.get && req.headers.get('content-type')) || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 415, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Rate limit: e.g., 10 creates per IP per 5 minutes
    const rl = await checkRateLimit(req, { key: 'createSecret', limit: 10, windowSeconds: 300 });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...rl.headers },
      });
    }

    // Parse the request body
    const body = await req.json();
    const { secret, expiryDays } = body;

    if (!secret || !secret.trim()) {
      return new Response(JSON.stringify({ error: 'Secret text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate secret length (max 10000 characters as per frontend)
    if (secret.length > 10000) {
      return new Response(JSON.stringify({ error: 'Secret text too long (max 10000 characters)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate and sanitize expiry days (default to 21, min 1, max 365)
    const validExpiryDays = expiryDays ? Math.min(Math.max(parseInt(expiryDays), 1), 365) : 21;

    // Check for encryption key
    const encryptionKey = process.env.NETLIFY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('NETLIFY_ENCRYPTION_KEY environment variable not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate a unique key
    const key = randomUUID();

    // Calculate expiration date using the provided expiry days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validExpiryDays);

    // Capture creation timestamp and client IP
    const createdAt = new Date().toISOString();
    // Extract IP similar to rateLimit.getClientIp
    let clientIp = 'unknown';
    try {
      const xfwd = req.headers.get('x-forwarded-for');
      if (xfwd) clientIp = xfwd.split(',')[0].trim();
      else if (req.headers.get('x-nf-client-connection-ip')) clientIp = req.headers.get('x-nf-client-connection-ip').trim();
    } catch (e) {
      // leave clientIp as 'unknown' if extraction fails
    }

    // Encrypt the secret
    const encryptedData = encryptSecret(secret.trim(), encryptionKey);

    // Initialize Neon connection (automatically uses NETLIFY_DATABASE_URL)
    const sql = neon();

    // Insert the encrypted secret into the database
    await sql`
      INSERT INTO secrets (key, secret, retrieved_at, expires_at, created_at, ip)
      VALUES (${key}, ${JSON.stringify(encryptedData)}, NULL, ${expiresAt.toISOString()}, ${createdAt}, ${clientIp})
    `;

    // Return the generated key
    return new Response(JSON.stringify({ 
      key: key,
      expires_at: expiresAt.toISOString(),
      message: 'Secret created successfully'
    }), {
      status: 201,
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
