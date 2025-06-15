import { neon } from '@netlify/neon';
import { randomUUID } from 'crypto';

export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse the request body
    const body = await req.json();
    const { secret } = body;

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

    // Generate a unique key
    const key = randomUUID();

    // Calculate expiration date (21 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 21);

    // Initialize Neon connection (automatically uses NETLIFY_DATABASE_URL)
    const sql = neon();

    // Insert the secret into the database
    await sql`
      INSERT INTO secrets (key, secret, retrieved_at, expires_at)
      VALUES (${key}, ${secret.trim()}, NULL, ${expiresAt.toISOString()})
    `;

    // Return the generated key
    return new Response(JSON.stringify({ 
      key: key,
      expires_at: expiresAt.toISOString(),
      message: 'Secret created successfully'
    }), {
      status: 201,
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
