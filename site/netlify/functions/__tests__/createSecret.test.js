import createSecret from '../createSecret';
import 'dotenv/config';

// ensure tests are explicit about required runtime envs
process.env.NETLIFY_ENCRYPTION_KEY = process.env.NETLIFY_ENCRYPTION_KEY || 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
process.env.NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL || 'postgres://user:pass@localhost/db';

const mockSql = jest.fn();
jest.mock('@netlify/neon', () => ({
  neon: () => mockSql,
}));

const makeReq = (overrides = {}) => ({
  method: 'POST',
  body: JSON.stringify({ secret: 'test secret' }),
  json: async () => ({ secret: 'test secret' }),
  headers: {
    get: (k) => (k === 'content-type' ? 'application/json' : null),
  },
  ...overrides,
});

describe('createSecret', () => {
  beforeEach(() => {
    mockSql.mockClear();
  });

  it('should return a 201 status code when given a valid secret', async () => {
    const response = await createSecret(makeReq());
    expect(response.status).toBe(201);
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when secret is missing', async () => {
    const req = makeReq({ json: async () => ({}) });
    const response = await createSecret(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/required/i);
  });

  it('should return 400 when secret is empty string', async () => {
    const req = makeReq({ json: async () => ({ secret: '   ' }) });
    const response = await createSecret(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when secret exceeds 10000 characters', async () => {
    const req = makeReq({ json: async () => ({ secret: 'a'.repeat(10001) }) });
    const response = await createSecret(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/too long/i);
  });

  it('should return 415 when Content-Type is not application/json', async () => {
    const req = makeReq({
      headers: { get: (k) => (k === 'content-type' ? 'text/plain' : null) },
    });
    const response = await createSecret(req);
    expect(response.status).toBe(415);
  });

  it('should return 405 for non-POST requests', async () => {
    const req = makeReq({ method: 'GET' });
    const response = await createSecret(req);
    expect(response.status).toBe(405);
  });
});