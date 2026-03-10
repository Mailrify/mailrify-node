import { ApiError, AuthenticationError, MailGlyphError, createMailGlyphError } from './errors';
import type { ApiKeyType, ApiErrorPayload, RequestOptions } from './types';

const DEFAULT_BASE_URL = 'https://api.mailglyph.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const SDK_VERSION = '0.1.0';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  fetchFn?: typeof fetch;
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly userAgent: string;
  public readonly keyType: ApiKeyType;

  constructor(config: HttpClientConfig) {
    this.apiKey = config.apiKey;
    this.fetchFn = config.fetchFn ?? fetch;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    this.userAgent = `mailglyph-node/${SDK_VERSION}`;

    if (this.apiKey.startsWith('sk_')) {
      this.keyType = 'secret';
      return;
    }

    if (this.apiKey.startsWith('pk_')) {
      this.keyType = 'public';
      return;
    }

    throw new AuthenticationError('Invalid API key format. Expected key to start with sk_ or pk_.');
  }

  public async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  public async post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  public async put<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  public async patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  public async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const authMode = options.authMode ?? 'secret';
    this.assertAuthAllowed(authMode);

    const url = this.buildUrl(path, options.query);
    const timeoutMs = options.timeout ?? this.timeout;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
      ...(options.headers ?? {})
    };

    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const requestInit: RequestInit = {
          method,
          headers,
          signal: controller.signal
        };

        if (options.body !== undefined) {
          requestInit.body = JSON.stringify(options.body);
        }

        const response = await this.fetchFn(url, requestInit);

        clearTimeout(timeoutId);

        const payload = await this.parseResponseBody(response);

        if (response.ok) {
          if (response.status === 204) {
            return undefined as T;
          }

          return payload as T;
        }

        const retryAfterSeconds = this.parseRetryAfterSeconds(response.headers.get('retry-after'));
        const canRetry = this.shouldRetry(response.status, attempt);

        if (canRetry) {
          const delayMs = this.resolveRetryDelayMs(attempt, retryAfterSeconds);
          await sleep(delayMs);
          attempt += 1;
          continue;
        }

        const errorPayload = isApiErrorPayload(payload) ? payload : undefined;
        throw createMailGlyphError(response.status, errorPayload, retryAfterSeconds ?? undefined);
      } catch (error) {
        if (error instanceof MailGlyphError) {
          throw error;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new ApiError(`Request timeout after ${timeoutMs}ms`);
        }

        if (this.shouldRetryNetworkError(attempt)) {
          const delayMs = exponentialBackoffMs(attempt);
          await sleep(delayMs);
          attempt += 1;
          continue;
        }

        throw new MailGlyphError('Network request failed', {
          details: {
            cause: error
          }
        });
      }
    }

    throw new ApiError('Retry attempts exhausted');
  }

  private assertAuthAllowed(mode: RequestOptions['authMode']): void {
    if (mode === 'none' || mode === undefined) {
      return;
    }

    if (mode === 'secret' && this.keyType !== 'secret') {
      throw new AuthenticationError('This endpoint requires a secret key (sk_*).');
    }

    if (mode === 'public' && this.keyType !== 'public') {
      throw new AuthenticationError('This endpoint requires a public key (pk_*).');
    }
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const url = new URL(path, this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`);

    if (query) {
      for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return (await response.json()) as unknown;
      } catch {
        return undefined;
      }
    }

    const text = await response.text();
    return text.length > 0 ? ({ message: text } satisfies ApiErrorPayload) : undefined;
  }

  private shouldRetry(status: number, attempt: number): boolean {
    return attempt < MAX_RETRIES && (status === 429 || status >= 500);
  }

  private shouldRetryNetworkError(attempt: number): boolean {
    return attempt < MAX_RETRIES;
  }

  private resolveRetryDelayMs(attempt: number, retryAfterSeconds: number | null): number {
    if (retryAfterSeconds !== null) {
      return retryAfterSeconds * 1000;
    }

    return exponentialBackoffMs(attempt);
  }

  private parseRetryAfterSeconds(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return Math.ceil(numeric);
    }

    const parsedDateMs = Date.parse(value);
    if (Number.isNaN(parsedDateMs)) {
      return null;
    }

    const deltaMs = parsedDateMs - Date.now();
    if (deltaMs <= 0) {
      return 0;
    }

    return Math.ceil(deltaMs / 1000);
  }
}

function exponentialBackoffMs(attempt: number): number {
  const base = 1000 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}
