import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/errors.js';
import { createMockFetch, createTestClient, jsonResponse, toUrl } from './helpers.js';

describe('DomainsAPI', () => {
  it('lists domains', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo) => {
      const url = toUrl(input);
      expect(url.toString()).toBe('https://app.mailrify.com/api/v1/domains');
      return jsonResponse([{ id: 1, name: 'example.com' }]);
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.domains.list();

    expect(response).toEqual([{ id: 1, name: 'example.com' }]);
  });

  it('creates domains with required payload', async () => {
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      const headers = init?.headers instanceof Headers ? init.headers : new Headers(init?.headers);
      expect(headers.get('content-type')).toBe('application/json');
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body).toEqual({ name: 'example.com', region: 'us-east-1' });
      return jsonResponse({ id: 1, name: 'example.com', region: 'us-east-1' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.domains.create({ name: 'example.com', region: 'us-east-1' });
    expect(response).toMatchObject({ id: 1, name: 'example.com' });
  });

  it('validates domain creation input', async () => {
    const client = createTestClient(fetch as unknown as typeof globalThis.fetch);
    await expect(client.domains.create({ name: '', region: 'us-east-1' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('fetches domain by id', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo) => {
      expect(toUrl(input).toString()).toBe('https://app.mailrify.com/api/v1/domains/42');
      return jsonResponse({ id: 42 });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const domain = await client.domains.get(42);
    expect(domain).toMatchObject({ id: 42 });
  });

  it('verifies domain dns records', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo, init?: RequestInit) => {
      expect(toUrl(input).toString()).toBe('https://app.mailrify.com/api/v1/domains/99/verify');
      expect(init?.method).toBe('PUT');
      return jsonResponse({ message: 'Verification started' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const result = await client.domains.verify(99);
    expect(result).toEqual({ message: 'Verification started' });
  });

  it('deletes domain', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo, init?: RequestInit) => {
      expect(toUrl(input).toString()).toBe('https://app.mailrify.com/api/v1/domains/15');
      expect(init?.method).toBe('DELETE');
      return jsonResponse({ id: 15, success: true, message: 'Removed' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const result = await client.domains.delete(15);
    expect(result).toMatchObject({ success: true });
  });
});
