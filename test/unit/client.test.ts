import { describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../src/client.js';
import type { RequestContext, ResponseContext } from '../../src/interceptors.js';
import { AuthError, HTTPError, RateLimitError, ValidationError } from '../../src/errors.js';
import { jsonResponse, toUrl } from './helpers.js';

const createClient = (fetchImpl: typeof fetch, overrides: Record<string, unknown> = {}) =>
  new HttpClient({
    apiKey: 'test-key',
    baseUrl: 'https://api.example.com',
    fetch: fetchImpl,
    maxRetries: 1,
    retryDelayMs: 0,
    timeout: 5_000,
    ...overrides,
  });

describe('HttpClient', () => {
  it('sends GET requests with auth header and query parameters', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = toUrl(input);
      expect(url.toString()).toBe(
        'https://api.example.com/v1/domains?page=2&filter=test&values=a&values=b',
      );

      expect(init?.method).toBe('GET');
      const headers = init?.headers instanceof Headers ? init.headers : new Headers(init?.headers);
      expect(headers.get('authorization')).toBe('Bearer test-key');
      expect(headers.get('accept')).toBe('application/json');

      return jsonResponse([{ id: 1 }]);
    });

    const client = createClient(fetchMock as unknown as typeof fetch);
    const response = await client.get('/v1/domains', {
      query: { page: 2, filter: 'test', values: ['a', 'b'] },
    });

    expect(response).toStrictEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('parses JSON responses and throws HTTPError on non-2xx status', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          message: 'Server error',
          code: 'E500',
        },
        { status: 500 },
      ),
    );

    const client = createClient(fetchMock as unknown as typeof fetch, { maxRetries: 0 });
    const promise = client.get('/v1/domains');

    await expect(promise).rejects.toBeInstanceOf(HTTPError);
    await promise.catch((error) => {
      expect(error).toMatchObject({
        status: 500,
        code: 'E500',
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('converts unauthorized responses into AuthError', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { message: 'Invalid token', code: 'invalid_auth' },
        {
          status: 401,
        },
      ),
    );

    const client = createClient(fetchMock as unknown as typeof fetch, { maxRetries: 0 });
    await expect(client.get('/v1/domains')).rejects.toBeInstanceOf(AuthError);
  });

  it('converts 429 responses into RateLimitError with retryAfter', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { message: 'Slow down' },
        {
          status: 429,
          headers: {
            'retry-after': '2',
          },
        },
      ),
    );

    const client = createClient(fetchMock as unknown as typeof fetch, { maxRetries: 0 });
    const promise = client.get('/v1/domains');

    await expect(promise).rejects.toBeInstanceOf(RateLimitError);
    await promise.catch((error) => {
      expect(error).toMatchObject({
        retryAfter: 2000,
      });
    });
  });

  it('retries idempotent requests on transient failures', async () => {
    const responses = [
      () => {
        throw new TypeError('network down');
      },
      () => jsonResponse({ ok: true }),
    ];

    const fetchMock = vi.fn(async () => {
      const next = responses.shift();
      return next ? next() : jsonResponse({ ok: true });
    });

    const client = createClient(fetchMock as unknown as typeof fetch, { retryDelayMs: 0 });
    const result = await client.get('/v1/domains');

    expect(result).toStrictEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('runs interceptors in order', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      const headers = init?.headers instanceof Headers ? init.headers : new Headers(init?.headers);
      expect(headers.get('x-trace-id')).toBe('abc');

      return jsonResponse({ ok: true });
    });

    const responseInterceptor = vi.fn(async (ctx: ResponseContext) => {
      return new Response(JSON.stringify({ wrapped: true }), {
        status: ctx.response.status,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = createClient(fetchMock as unknown as typeof fetch, {
      interceptors: {
        request: [
          async (ctx: RequestContext) => {
            const headers =
              ctx.init.headers instanceof Headers
                ? ctx.init.headers
                : new Headers(ctx.init.headers);
            headers.set('x-trace-id', 'abc');
            return {
              ...ctx,
              init: { ...ctx.init, headers },
            };
          },
        ],
        response: [responseInterceptor],
      },
    });

    const response = await client.get('/v1/domains');
    expect(response).toStrictEqual({ wrapped: true });
    expect(responseInterceptor).toHaveBeenCalledTimes(1);
  });

  it('throws ValidationError when configuration missing apiKey', () => {
    expect(
      () =>
        new HttpClient({
          apiKey: '',
          fetch: fetch as typeof globalThis.fetch,
        }),
    ).toThrow(ValidationError);
  });
});
