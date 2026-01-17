import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from 'crypto';

/**
 * Encrypt a UTF-8 string using AES-256-GCM.
 * Returns a JSON-serializable object with salt/iv/authTag and hex ciphertext.
 */
export function encryptSecret(text, encryptionKey) {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  if (typeof encryptionKey !== 'string') throw new TypeError('encryptionKey must be a string');

  const salt = randomBytes(16);
  const iv = randomBytes(16);
  const key = scryptSync(encryptionKey, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
  };
}

/**
 * Decrypt an object produced by encryptSecret.
 * Throws on authentication/format errors.
 */
export function decryptSecret(obj, encryptionKey) {
  if (!obj || typeof obj !== 'object') throw new TypeError('invalid encrypted object');
  if (typeof encryptionKey !== 'string') throw new TypeError('encryptionKey must be a string');

  const { encrypted, iv, authTag, salt } = obj;
  if (!encrypted || !iv || !authTag || !salt) throw new Error('malformed encrypted payload');

  const key = scryptSync(encryptionKey, Buffer.from(salt, 'hex'), 32);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
