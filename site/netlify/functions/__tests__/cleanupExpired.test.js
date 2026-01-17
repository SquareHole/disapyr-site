import handler from '../cleanupExpired';

const mockSql = jest.fn();
jest.mock('@netlify/neon', () => ({
  neon: () => mockSql,
}));

describe('cleanupExpired', () => {
  beforeEach(() => {
    mockSql.mockClear();
    process.env.NETLIFY_ENCRYPTION_KEY = process.env.NETLIFY_ENCRYPTION_KEY || 'a'.repeat(64);
    process.env.NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL || 'postgres://user:pass@localhost/db';
  });

  it('returns deleted counts when SQL succeeds', async () => {
    mockSql.mockResolvedValueOnce([{ expired_deleted: 2, old_retrieved_deleted: 1 }]);
    const res = await handler();
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.expired_deleted).toBe(2);
    expect(body.old_retrieved_deleted).toBe(1);
  });

  it('returns 500 when the DB throws', async () => {
    mockSql.mockRejectedValueOnce(new Error('boom'));
    const res = await handler();
    expect(res.status).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(false);
  });
});
