import { neon } from '@netlify/neon';

// Netlify Scheduled Function: cleanupExpired
// Schedule via Netlify UI or netlify.toml (cron): e.g., '0 * * * *' (hourly)
// Purpose:
//  - Permanently delete rows where expires_at < now()
//  - Remove rows retrieved > 7 days ago (metadata hygiene)
// Safe by design: content is already NULL after retrieval

export default async function handler() {
  try {
    const sql = neon();
    const nowIso = new Date().toISOString();

    // Delete expired secrets (never retrieved) and cleanup old retrieved metadata
    const results = await sql`
      WITH del_expired AS (
        DELETE FROM secrets
        WHERE expires_at < ${nowIso}
        RETURNING 1 AS deleted
      ), del_old_retrieved AS (
        DELETE FROM secrets
        WHERE retrieved_at IS NOT NULL AND retrieved_at < (${nowIso}::timestamp - interval '7 days')
        RETURNING 1 AS deleted
      )
      SELECT
        (SELECT count(*) FROM del_expired)::int AS expired_deleted,
        (SELECT count(*) FROM del_old_retrieved)::int AS old_retrieved_deleted;
    `;

    const [row] = results || [{ expired_deleted: 0, old_retrieved_deleted: 0 }];

    return new Response(
      JSON.stringify({
        ok: true,
        expired_deleted: row.expired_deleted,
        old_retrieved_deleted: row.old_retrieved_deleted,
        timestamp: nowIso,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Cleanup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = {
  schedule: '@hourly', // Netlify Scheduled Functions: hourly by default; adjust as needed
};
