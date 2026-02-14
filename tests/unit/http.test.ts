import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, AuthenticationError, NotFoundError, RateLimitError, ValidationError } from '../../src/errors';
import { HttpClient } from '../../src/http';
import { getRequest, installFetchMock, jsonResponse } from './test-utils';

describe('HttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends bearer auth, content type, and user-agent headers', async () => {
    const fetchMock = installFetchMock([jsonResponse({ ok: true })]);
    const client = new HttpClient({ apiKey: 'sk_test_123' });

    await client.get('/contacts', { authMode: 'secret' });

    const { init, url } = getRequest(fetchMock);
    expect(url).toBe('https://api.mailrify.com/contacts');

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk_test_123');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toBe('mailrify-node/0.1.0');
  });

  it('uses custom base URL', async () => {
    const fetchMock = installFetchMock([jsonResponse({ contacts: [], hasMore: false })]);
    const client = new HttpClient({ apiKey: 'sk_test_123', baseUrl: 'https://staging.mailrify.dev' });

    await client.get('/contacts', { authMode: 'secret' });

    const { url } = getRequest(fetchMock);
    expect(url).toBe('https://staging.mailrify.dev/contacts');
  });

  it('maps HTTP errors to typed exceptions', async () => {
    installFetchMock([jsonResponse({ message: 'invalid' }, 400)]);
    let client = new HttpClient({ apiKey: 'sk_test_123' });
    await expect(client.get('/contacts', { authMode: 'secret' })).rejects.toBeInstanceOf(ValidationError);

    installFetchMock([jsonResponse({ message: 'unauthorized' }, 401)]);
    client = new HttpClient({ apiKey: 'sk_test_123' });
    await expect(client.get('/contacts', { authMode: 'secret' })).rejects.toBeInstanceOf(AuthenticationError);

    installFetchMock([jsonResponse({ message: 'missing' }, 404)]);
    client = new HttpClient({ apiKey: 'sk_test_123' });
    await expect(client.get('/contacts', { authMode: 'secret' })).rejects.toBeInstanceOf(NotFoundError);

    installFetchMock([
      jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '0' }),
      jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '0' }),
      jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '0' }),
      jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '0' })
    ]);
    client = new HttpClient({ apiKey: 'sk_test_123' });
    await expect(client.get('/contacts', { authMode: 'secret' })).rejects.toBeInstanceOf(RateLimitError);

    installFetchMock([
      jsonResponse({ message: 'oops' }, 500, { 'retry-after': '0' }),
      jsonResponse({ message: 'oops' }, 500, { 'retry-after': '0' }),
      jsonResponse({ message: 'oops' }, 500, { 'retry-after': '0' }),
      jsonResponse({ message: 'oops' }, 500, { 'retry-after': '0' })
    ]);
    client = new HttpClient({ apiKey: 'sk_test_123' });
    await expect(client.get('/contacts', { authMode: 'secret' })).rejects.toBeInstanceOf(ApiError);
  });

  it('retries for 429 and succeeds', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ message: 'slow down' }, 429, { 'retry-after': '0' }),
      jsonResponse({ contacts: [], hasMore: false }, 200)
    ]);
    const client = new HttpClient({ apiKey: 'sk_test_123' });

    const result = await client.get<{ contacts: unknown[]; hasMore: boolean }>('/contacts', {
      authMode: 'secret'
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.hasMore).toBe(false);
  });

  it('throws timeout errors for aborted requests', async () => {
    installFetchMock([new DOMException('aborted', 'AbortError')]);
    const client = new HttpClient({ apiKey: 'sk_test_123', timeout: 10 });

    await expect(client.get('/contacts', { authMode: 'secret' })).rejects.toThrow('Request timeout after 10ms');
  });

  it('enforces key type restrictions', async () => {
    installFetchMock([jsonResponse({ ok: true })]);
    const publicClient = new HttpClient({ apiKey: 'pk_test_123' });

    await expect(publicClient.get('/contacts', { authMode: 'secret' })).rejects.toThrow(
      'This endpoint requires a secret key (sk_*).'
    );

    const secretClient = new HttpClient({ apiKey: 'sk_test_123' });
    await expect(secretClient.post('/v1/track', { authMode: 'public', body: {} })).rejects.toThrow(
      'This endpoint requires a public key (pk_*).'
    );
  });
});
