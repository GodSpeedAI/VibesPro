import { ApiClient, ApiError } from '../api-client';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({ baseUrl: 'http://localhost:8000' });
  });

  describe('GET requests', () => {
    it('should make GET requests with type safety', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: '123', name: 'Test' }),
      });

      const result = await client.get<{ id: string; name: string }>('/api/test');

      expect(result).toEqual({ id: '123', name: 'Test' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/test',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(client.get('/api/404')).rejects.toThrow(ApiError);
    });
  });

  describe('Authentication', () => {
    it('should set auth token', async () => {
      client.setAuthToken('test-token');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      await client.get('/api/protected');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });
});
