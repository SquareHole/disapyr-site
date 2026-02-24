import getSecret from '../getSecret';
import 'dotenv/config';

process.env.NETLIFY_ENCRYPTION_KEY = process.env.NETLIFY_ENCRYPTION_KEY || 'a'.repeat(64);
process.env.NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL || 'postgres://user:pass@localhost/db';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const mockSql = jest.fn();
jest.mock('@netlify/neon', () => ({
  neon: () => mockSql,
}));

const mockDecrypt = jest.fn().mockReturnValue('decrypted-secret');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createDecipheriv: () => ({
    update: mockDecrypt,
    final: () => '',
    setAuthTag: () => {},
  }),
}));

describe('getSecret', () => {
  beforeEach(() => {
    mockSql.mockClear();
    mockDecrypt.mockClear();
  });

  it('should return a 200 status code and the secret when given a valid key', async () => {
    const encryptedData = {
      encrypted: 'encrypted-secret',
      iv: Buffer.from('iv').toString('hex'),
      authTag: Buffer.from('authTag').toString('hex'),
      salt: Buffer.from('salt').toString('hex'),
    };
    // First call: atomic UPDATE...RETURNING delivers the encrypted row
    mockSql.mockResolvedValueOnce([{
      key: VALID_UUID,
      secret: JSON.stringify(encryptedData),
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      retrieved_at: new Date().toISOString(),
    }]);
    // Second call: UPDATE secret = NULL (nullification)
    mockSql.mockResolvedValueOnce([]);

    const req = {
      method: 'GET',
      url: `http://localhost/.netlify/functions/getSecret?key=${VALID_UUID}`,
    };
    const response = await getSecret(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.secret).toBe('decrypted-secret');
    // First call: atomic UPDATE...RETURNING; second call: nullify secret content
    expect(mockSql).toHaveBeenCalledTimes(2);
  });

  it('should return 400 when no key is provided', async () => {
    const req = { method: 'GET', url: 'http://localhost/.netlify/functions/getSecret' };
    const response = await getSecret(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when key is not a valid UUID', async () => {
    const req = { method: 'GET', url: 'http://localhost/.netlify/functions/getSecret?key=not-a-uuid' };
    const response = await getSecret(req);
    expect(response.status).toBe(400);
  });

  it('should return 404 when secret does not exist or already retrieved', async () => {
    mockSql.mockResolvedValueOnce([]); // atomic UPDATE returns no rows
    const req = { method: 'GET', url: `http://localhost/.netlify/functions/getSecret?key=${VALID_UUID}` };
    const response = await getSecret(req);
    expect(response.status).toBe(404);
  });

  it('should return 405 for non-GET requests', async () => {
    const req = { method: 'POST', url: `http://localhost/.netlify/functions/getSecret?key=${VALID_UUID}` };
    const response = await getSecret(req);
    expect(response.status).toBe(405);
  });
});