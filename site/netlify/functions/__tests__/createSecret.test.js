import createSecret from '../createSecret';
import 'dotenv/config';

// ensure tests are explicit about required runtime envs
process.env.NETLIFY_ENCRYPTION_KEY = process.env.NETLIFY_ENCRYPTION_KEY || 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

const mockSql = jest.fn();
jest.mock('@netlify/neon', () => ({
  neon: () => mockSql,
}));

describe('createSecret', () => {
  beforeEach(() => {
    mockSql.mockClear();
  });

  it('should return a 201 status code when given a valid secret', async () => {
    const req = {
      method: 'POST',
      body: JSON.stringify({ secret: 'test secret' }),
      json: async () => ({ secret: 'test secret' }),
      headers: {
        get: (k) => (k === 'content-type' ? 'application/json' : undefined),
      },
    };
    const response = await createSecret(req);

    expect(response.status).toBe(201);
    expect(mockSql).toHaveBeenCalledTimes(1);
  });
});