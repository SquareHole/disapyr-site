import createSecret from '../createSecret';
import 'dotenv/config';

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
    };
    const context = {};

    const response = await createSecret(req);

    expect(response.status).toBe(201);
    expect(mockSql).toHaveBeenCalledTimes(1);
  });
});