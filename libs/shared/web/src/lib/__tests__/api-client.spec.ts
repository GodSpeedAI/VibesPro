import { ApiClient, ApiError } from '../api-client';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({ baseUrl: 'http://localhost:8000' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET requests with type safety', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createFetchResponse({
          body: JSON.stringify({ id: '123', name: 'Test' }),
        }),
      );

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
      global.fetch = jest.fn().mockResolvedValue(
        createFetchResponse({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          body: 'Not Found',
        }),
      );

      await expect(client.get('/api/404')).rejects.toThrow(ApiError);
    });

    it('should handle network failures', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(client.get('/api/network-error')).rejects.toThrow('Network error');
    });
  });

  describe('Authentication', () => {
    it('should set auth token', async () => {
      client.setAuthToken('test-token');

      global.fetch = jest.fn().mockResolvedValue(
        createFetchResponse({
          body: JSON.stringify({ data: 'test' }),
        }),
      );

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

function createFetchResponse({
  ok = true,
  status = 200,
  statusText = 'OK',
  headers = { 'content-type': 'application/json' },
  body = '',
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
}) {
  return {
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    text: jest.fn().mockResolvedValue(body),
  };
}
