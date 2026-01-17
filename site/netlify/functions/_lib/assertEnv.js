// Runtime environment assertions — fail fast in dev/CI when configuration is invalid
export function assertEnv() {
  const missing = [];
  if (!process.env.NETLIFY_ENCRYPTION_KEY) missing.push('NETLIFY_ENCRYPTION_KEY');
  if (!process.env.NETLIFY_DATABASE_URL) missing.push('NETLIFY_DATABASE_URL');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const key = process.env.NETLIFY_ENCRYPTION_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('NETLIFY_ENCRYPTION_KEY must be a 64-character hex string');
  }

  const db = process.env.NETLIFY_DATABASE_URL || '';
  // basic sanity check for a DB URL — be permissive but catch obvious misconfigs
  if (!/^postgres(?:ql)?:\/\//i.test(db) && !/neon\.tech|neon:/.test(db)) {
    // allow local file/other formats in very advanced setups, but warn in CI/dev
    throw new Error('NETLIFY_DATABASE_URL does not look like a valid Postgres/Neon connection string');
  }
}

export function isHexKey(v) {
  return typeof v === 'string' && /^[0-9a-fA-F]{64}$/.test(v);
}
