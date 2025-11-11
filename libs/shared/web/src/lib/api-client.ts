/**
 * Universal API Client
 *
 * Framework-agnostic HTTP client with type safety.
 * Works across Next.js, Remix, and Expo (React Native).
 *
 * @see DEV-ADR-028 - Universal React Generator
 * @see DEV-PRD-029 - Framework-specific scaffolds
 */

export interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  onError?: (error: ApiError) => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: unknown,
  ) {
    super(`API Error ${status}: ${message}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private onError?: (error: ApiError) => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.timeout = config.timeout ?? 30000;
    this.onError = config.onError;
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', path, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', path, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', path, {
      ...options,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(method: string, path: string, options?: RequestInit): Promise<T> {
    const url = this.resolveUrl(path);

    const headers = {
      ...this.defaultHeaders,
      ...(options?.headers ?? {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        ...options,
        signal: options?.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new ApiError(response.status, errorText || response.statusText);

        if (this.onError) {
          this.onError(error);
        }

        throw error;
      }

      if (this.isNoContentResponse(method, response)) {
        return undefined as T;
      }

      const raw = await response.text();
      if (!raw) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(raw) as T;
        } catch (parseError) {
          throw new ApiError(
            response.status,
            'Failed to parse JSON response',
            parseError instanceof Error ? parseError.message : raw,
          );
        }
      }

      return raw as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      const apiError = new ApiError(0, error instanceof Error ? error.message : 'Network error');

      if (this.onError) {
        this.onError(apiError);
      }

      throw apiError;
    }
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authorization header
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }

    if (!this.baseUrl) {
      return path;
    }

    const normalizedBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedBase}${normalizedPath}`;
  }

  private isNoContentResponse(method: string, response: Response): boolean {
    if (method === 'HEAD') {
      return true;
    }

    if (response.status === 204 || response.status === 205 || response.status === 304) {
      return true;
    }

    const contentLength = response.headers.get('content-length');
    return contentLength === '0';
  }
}
