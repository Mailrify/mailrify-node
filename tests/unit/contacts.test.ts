import { afterEach, describe, expect, it, vi } from 'vitest';

import MailGlyph, { NotFoundError } from '../../src';
import { getRequest, installFetchMock, jsonResponse, emptyResponse } from './test-utils';

const baseContact = {
  id: 'c_123',
  email: 'user@example.com',
  subscribed: true,
  status: 'ACTIVE',
  expiresAt: null,
  projectId: 'proj_123',
  data: { firstName: 'John' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('contacts resource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('list() returns cursor paginated contacts', async () => {
    installFetchMock([
      jsonResponse({
        data: [baseContact],
        cursor: 'next_cursor',
        hasMore: true,
        total: 100
      })
    ]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.contacts.list({ limit: 1 });

    expect(result.data).toHaveLength(1);
    expect(result.cursor).toBe('next_cursor');
    expect(result.hasMore).toBe(true);
  });

  it('list() supports filters', async () => {
    const fetchMock = installFetchMock([jsonResponse({ data: [], hasMore: false })]);
    const client = new MailGlyph('sk_test_123');

    await client.contacts.list({ subscribed: true, search: 'john', limit: 10 });

    const { url } = getRequest(fetchMock);
    expect(url).toContain('subscribed=true');
    expect(url).toContain('search=john');
    expect(url).toContain('limit=10');
  });

  it('get() returns a single contact', async () => {
    installFetchMock([jsonResponse(baseContact)]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.contacts.get('c_123');

    expect(result.id).toBe('c_123');
  });

  it('get() throws NotFoundError on 404', async () => {
    installFetchMock([jsonResponse({ message: 'Contact not found' }, 404)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.contacts.get('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('create() supports new contact response (_meta.isNew)', async () => {
    installFetchMock([jsonResponse({ ...baseContact, _meta: { isNew: true, isUpdate: false } }, 201)]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.contacts.create({ email: 'user@example.com' });

    expect(result._meta?.isNew).toBe(true);
  });

  it('create() supports upsert response (_meta.isUpdate)', async () => {
    installFetchMock([jsonResponse({ ...baseContact, _meta: { isNew: false, isUpdate: true } }, 200)]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.contacts.create({ email: 'user@example.com' });

    expect(result._meta?.isUpdate).toBe(true);
  });

  it('update() supports subscribed-only updates', async () => {
    installFetchMock([jsonResponse({ ...baseContact, subscribed: false })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.contacts.update('c_123', { subscribed: false });

    expect(result.subscribed).toBe(false);
  });

  it('update() supports custom data updates', async () => {
    const fetchMock = installFetchMock([jsonResponse({ ...baseContact, data: { plan: 'premium' } })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.contacts.update('c_123', { data: { plan: 'premium' } });

    expect(result.data).toMatchObject({ plan: 'premium' });
    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).data.plan).toBe('premium');
  });

  it('delete() succeeds with 204', async () => {
    installFetchMock([emptyResponse(204)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.contacts.delete('c_123')).resolves.toBeUndefined();
  });

  it('delete() throws NotFoundError on 404', async () => {
    installFetchMock([jsonResponse({ message: 'Contact not found' }, 404)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.contacts.delete('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('count() returns total from list response', async () => {
    installFetchMock([jsonResponse({ data: [baseContact], hasMore: false, total: 42 })]);
    const client = new MailGlyph('sk_test_123');

    const count = await client.contacts.count({ subscribed: true });

    expect(count).toBe(42);
  });

  it('count() falls back to page length when total is omitted', async () => {
    installFetchMock([jsonResponse({ data: [baseContact], hasMore: false })]);
    const client = new MailGlyph('sk_test_123');

    const count = await client.contacts.count();

    expect(count).toBe(1);
  });
});
