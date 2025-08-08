import getSecret from '../getSecret';
import 'dotenv/config';

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
    mockSql.mockResolvedValueOnce([{
      key: 'test-key',
      secret: JSON.stringify(encryptedData),
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      retrieved_at: null,
    }]);

    const req = {
      method: 'GET',
      url: 'http://localhost/.netlify/functions/getSecret?key=test-key',
    };
    const response = await getSecret(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.secret).toBe('decrypted-secret');
  expect(mockSql).toHaveBeenCalledTimes(2); // Once to get, once to soft-delete (UPDATE)
  });
});