import { encryptSecret, decryptSecret } from '../_lib/crypto';
import { assertEnv, isHexKey } from '../_lib/assertEnv';

describe('crypto helpers', () => {
  const key = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

  it('round-trips plaintext correctly', () => {
    const payload = 'this is a secret ✅';
    const boxed = encryptSecret(payload, key);
    expect(typeof boxed.encrypted).toBe('string');
    const out = decryptSecret(boxed, key);
    expect(out).toBe(payload);
  });

  it('throws on tampered ciphertext/authTag', () => {
    const boxed = encryptSecret('x', key);
    // Tamper with ciphertext: flip first hex char (f->0, anything else->f)
    const firstChar = boxed.encrypted[0];
    const tamperedChar = firstChar === 'f' ? '0' : 'f';
    const broken = { ...boxed, encrypted: tamperedChar + boxed.encrypted.slice(1) };
    expect(() => decryptSecret(broken, key)).toThrow();

    // Tamper with authTag: flip first hex char the same way
    const tagFirstChar = boxed.authTag[0];
    const tamperedTagChar = tagFirstChar === 'f' ? '0' : 'f';
    const brokenTag = { ...boxed, authTag: tamperedTagChar + boxed.authTag.slice(1) };
    expect(() => decryptSecret(brokenTag, key)).toThrow();
  });

  it('assertEnv validates the hex key format', () => {
    const good = 'a'.repeat(64);
    const bad = 'not-a-hex-key';
    expect(isHexKey(good)).toBe(true);
    expect(isHexKey(bad)).toBe(false);

    const prev = process.env.NETLIFY_ENCRYPTION_KEY;
    delete process.env.NETLIFY_ENCRYPTION_KEY;
    delete process.env.NETLIFY_DATABASE_URL;
    expect(() => assertEnv()).toThrow();
    process.env.NETLIFY_ENCRYPTION_KEY = good;
    process.env.NETLIFY_DATABASE_URL = 'postgres://user:pass@localhost/db';
    expect(() => assertEnv()).not.toThrow();
    process.env.NETLIFY_ENCRYPTION_KEY = prev;
  });
});
