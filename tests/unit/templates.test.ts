import { afterEach, describe, expect, it, vi } from 'vitest';

import MailGlyph, { NotFoundError } from '../../src';
import { getRequest, installFetchMock, jsonResponse, emptyResponse } from './test-utils';

const template = {
  id: 'tpl_123',
  name: 'Welcome Template',
  description: 'First-touch welcome message',
  subject: 'Welcome to MailGlyph',
  body: '<h1>Welcome</h1>',
  text: 'Welcome',
  from: 'hello@example.com',
  fromName: 'MailGlyph',
  replyTo: 'reply@example.com',
  type: 'TRANSACTIONAL',
  projectId: 'proj_123',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z'
} as const;

describe('templates resource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('list() returns paginated templates using data key', async () => {
    installFetchMock([
      jsonResponse({ data: [template], total: 1, page: 1, pageSize: 20, totalPages: 1 })
    ]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.templates.list();

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
  });

  it('list() supports query params', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
    ]);
    const client = new MailGlyph('sk_test_123');

    await client.templates.list({ type: 'MARKETING', search: 'welcome', limit: 10, cursor: 'abc' });

    const { url } = getRequest(fetchMock);
    expect(url).toContain('type=MARKETING');
    expect(url).toContain('search=welcome');
    expect(url).toContain('limit=10');
    expect(url).toContain('cursor=abc');
  });

  it('create() returns template', async () => {
    installFetchMock([jsonResponse(template, 201)]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.templates.create({
      name: 'Welcome Template',
      subject: 'Welcome to MailGlyph',
      body: '<h1>Welcome</h1>',
      type: 'TRANSACTIONAL'
    });

    expect(result.id).toBe('tpl_123');
    expect(result.from).toBe('hello@example.com');
  });

  it('get() returns template by id', async () => {
    installFetchMock([jsonResponse(template)]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.templates.get('tpl_123');

    expect(result.id).toBe('tpl_123');
    expect(result.updatedAt).toBe('2026-01-02T00:00:00Z');
  });

  it('update() sends patch payload', async () => {
    const fetchMock = installFetchMock([jsonResponse({ ...template, subject: 'Updated Subject' })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.templates.update('tpl_123', { subject: 'Updated Subject' });

    expect(result.subject).toBe('Updated Subject');
    const { init } = getRequest(fetchMock);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body)).subject).toBe('Updated Subject');
  });

  it('delete() succeeds with 204', async () => {
    installFetchMock([emptyResponse(204)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.templates.delete('tpl_123')).resolves.toBeUndefined();
  });

  it('get() throws NotFoundError on 404', async () => {
    installFetchMock([jsonResponse({ message: 'Template not found' }, 404)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.templates.get('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});
