import { afterEach, vi } from 'vitest';
import { Client } from '../../src/index.js';

afterEach(() => {
  vi.restoreAllMocks();
});

export const jsonResponse = (data: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
};

export const emptyResponse = (init: ResponseInit = {}): Response => new Response(undefined, init);

export const createMockFetch = <
  TArgs extends Parameters<typeof fetch> = Parameters<typeof fetch>,
  TReturn extends ReturnType<typeof fetch> = ReturnType<typeof fetch>,
>(
  implementation: (...args: TArgs) => TReturn | PromiseLike<TReturn>,
) => {
  return vi.fn(implementation);
};

export const toUrl = (input: RequestInfo): URL => {
  if (input instanceof URL) {
    return input;
  }

  if (typeof input === 'string') {
    return new URL(input);
  }

  return new URL(input.url);
};

export const createTestClient = (
  fetchImpl: typeof fetch,
  overrides: Partial<ConstructorParameters<typeof Client>[0]> = {},
) =>
  new Client({
    apiKey: 'test-api-key',
    fetch: fetchImpl,
    baseUrl: 'https://app.mailrify.com/api',
    maxRetries: 0,
    retryDelayMs: 0,
    timeout: 5_000,
    ...overrides,
  });

export const headersToObject = (headers: HeadersInit | undefined): Record<string, string> => {
  if (!headers) {
    return {};
  }
  const result: Record<string, string> = {};
  const normalized =
    headers instanceof Headers ? headers : new Headers(headers as Record<string, string>);
  normalized.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};
