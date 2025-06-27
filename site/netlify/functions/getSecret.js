import { neon } from '@netlify/neon';
import { createDecipheriv, scryptSync } from 'crypto';

// Decryption function
function decryptSecret(encryptedData, encryptionKey) {
  try {
    const { encrypted, iv, authTag, salt } = encryptedData;
    
    const key = scryptSync(encryptionKey, Buffer.from(salt, 'hex'), 32); // Derive key from password
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt secret');
  }
}

export default async (req) => {
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

    // Delete the secret from the database
    await sql`
      DELETE FROM secrets 
      WHERE key = ${key}
    `;

    // Return the decrypted secret
    return new Response(JSON.stringify({ 
      key: secret.key,
      secret: decryptedSecret,
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
