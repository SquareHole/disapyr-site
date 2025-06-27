import { neon } from '@netlify/neon';
import { randomUUID, createCipheriv, randomBytes, scryptSync } from 'crypto';

// Encryption function
function encryptSecret(text, encryptionKey) {
  const salt = randomBytes(16); // Generate random salt
  const iv = randomBytes(16); // Generate random IV
  const key = scryptSync(encryptionKey, salt, 32); // Derive key from password
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return encrypted data with IV, auth tag, and salt
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex')
  };
}

export default async (req) => {
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

    // Encrypt the secret
    const encryptedData = encryptSecret(secret.trim(), encryptionKey);

    // Initialize Neon connection (automatically uses NETLIFY_DATABASE_URL)
    const sql = neon();

    // Insert the encrypted secret into the database
    await sql`
      INSERT INTO secrets (key, secret, retrieved_at, expires_at)
      VALUES (${key}, ${JSON.stringify(encryptedData)}, NULL, ${expiresAt.toISOString()})
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
