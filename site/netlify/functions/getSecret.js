import { neon } from '@netlify/neon';

export default async (req, context) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the key from query parameters
    const url = new URL(req.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(JSON.stringify({ error: 'Key parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Neon connection (automatically uses NETLIFY_DATABASE_URL)
    const sql = neon();

    // First, check if the secret exists and hasn't been retrieved yet
    const [secret] = await sql`
      SELECT key, secret, expires_at, retrieved_at 
      FROM secrets 
      WHERE key = ${key} AND retrieved_at IS NULL
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

    // Update the retrieved_at timestamp
    await sql`
      UPDATE secrets 
      SET retrieved_at = ${now.toISOString()} 
      WHERE key = ${key}
    `;

    // Return the secret
    return new Response(JSON.stringify({ 
      key: secret.key,
      secret: secret.secret,
      retrieved_at: now.toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
