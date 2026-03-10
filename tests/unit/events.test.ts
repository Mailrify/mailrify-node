import { afterEach, describe, expect, it, vi } from 'vitest';

import MailGlyph, { AuthenticationError } from '../../src';
import { getRequest, installFetchMock, jsonResponse } from './test-utils';

describe('events resource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('track() sends a simple event', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { contact: 'c1', event: 'e1', timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('pk_test_123');

    const result = await client.events.track({ email: 'user@example.com', event: 'signup' });

    expect(result.success).toBe(true);
    const { url, init } = getRequest(fetchMock);
    expect(url).toBe('https://api.mailglyph.com/v1/track');
    expect(JSON.parse(String(init.body))).toMatchObject({ email: 'user@example.com', event: 'signup' });
  });

  it('track() supports custom data payload', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { contact: 'c1', event: 'e1', timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('pk_test_123');

    await client.events.track({
      email: 'user@example.com',
      event: 'purchase',
      data: { product: 'premium', amount: 99 }
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).data.amount).toBe(99);
  });

  it('track() works with pk_* keys', async () => {
    installFetchMock([jsonResponse({ success: true, data: { contact: 'c1', event: 'e1', timestamp: '2026-01-01T00:00:00Z' } })]);
    const client = new MailGlyph('pk_test_123');

    await expect(client.events.track({ email: 'user@example.com', event: 'signup' })).resolves.toMatchObject({
      success: true
    });
  });

  it('track() rejects sk_* keys', async () => {
    installFetchMock([]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.events.track({ email: 'user@example.com', event: 'signup' })).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it('listNames() returns event names array', async () => {
    installFetchMock([jsonResponse({ eventNames: ['signup', 'purchase'] })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.events.listNames();

    expect(result.eventNames).toEqual(['signup', 'purchase']);
  });

  it('getNames() alias works', async () => {
    installFetchMock([jsonResponse({ eventNames: ['signup'] })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.events.getNames();

    expect(result.eventNames).toEqual(['signup']);
  });

  it('listNames() rejects pk_* keys', async () => {
    installFetchMock([]);
    const client = new MailGlyph('pk_test_123');

    await expect(client.events.listNames()).rejects.toBeInstanceOf(AuthenticationError);
  });
});
