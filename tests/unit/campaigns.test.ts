import { afterEach, describe, expect, it, vi } from 'vitest';

import MailGlyph, { NotFoundError, ValidationError } from '../../src';
import type { CreateCampaignParams } from '../../src';
import { getRequest, installFetchMock, jsonResponse } from './test-utils';

const campaign = {
  id: 'cmp_123',
  name: 'Launch',
  description: 'Launch campaign',
  subject: 'Hello',
  body: '<p>Body</p>',
  from: 'hello@example.com',
  fromName: 'Team',
  replyTo: 'reply@example.com',
  audienceType: 'ALL',
  audienceCondition: {
    logic: 'AND',
    groups: [{ filters: [{ field: 'data.plan', operator: 'equals', value: 'premium' }] }]
  },
  segmentId: null,
  status: 'DRAFT',
  totalRecipients: 100,
  sentCount: 0,
  deliveredCount: 0,
  openedCount: 0,
  clickedCount: 0,
  bouncedCount: 0,
  scheduledFor: null,
  sentAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
} as const;

describe('campaigns resource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('list() returns paginated campaigns', async () => {
    installFetchMock([jsonResponse({ data: [campaign], page: 1, pageSize: 20, total: 1, totalPages: 1 })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.list();

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('list() supports page/pageSize/status query params', async () => {
    const fetchMock = installFetchMock([jsonResponse({ data: [], page: 2, pageSize: 10, total: 0, totalPages: 0 })]);
    const client = new MailGlyph('sk_test_123');

    await client.campaigns.list({ page: 2, pageSize: 10, status: 'CANCELLED' });

    const { url } = getRequest(fetchMock);
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=10');
    expect(url).toContain('status=CANCELLED');
  });

  it('create() works with required fields', async () => {
    installFetchMock([jsonResponse({ success: true, data: campaign }, 201)]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.create({
      name: 'Launch',
      subject: 'Hello',
      body: '<p>Body</p>',
      from: 'hello@example.com',
      audienceType: 'ALL'
    });

    expect(result.id).toBe('cmp_123');
  });

  it('create() throws ValidationError on 400', async () => {
    installFetchMock([jsonResponse({ message: 'subject is required' }, 400)]);
    const client = new MailGlyph('sk_test_123');

    await expect(
      client.campaigns.create({
        name: 'Launch',
        body: '<p>Body</p>',
        from: 'hello@example.com',
        audienceType: 'ALL'
      } as CreateCampaignParams)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('get() returns campaign by ID', async () => {
    installFetchMock([jsonResponse({ success: true, data: campaign })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.get('cmp_123');

    expect(result.id).toBe('cmp_123');
  });

  it('get() throws NotFoundError on 404', async () => {
    installFetchMock([jsonResponse({ message: 'Campaign not found' }, 404)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.campaigns.get('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('update() performs partial update', async () => {
    installFetchMock([jsonResponse({ success: true, data: { ...campaign, subject: 'Updated' } })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.update('cmp_123', { subject: 'Updated' });

    expect(result.subject).toBe('Updated');
  });

  it('update() supports audienceCondition filter schema', async () => {
    const fetchMock = installFetchMock([jsonResponse({ success: true, data: campaign })]);
    const client = new MailGlyph('sk_test_123');

    await client.campaigns.update('cmp_123', {
      audienceCondition: {
        logic: 'AND',
        groups: [{ filters: [{ field: 'subscribed', operator: 'equals', value: true }] }]
      }
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).audienceCondition.logic).toBe('AND');
  });

  it('send() supports immediate send without scheduledFor', async () => {
    const fetchMock = installFetchMock([jsonResponse({ success: true, message: 'Sending' })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.send('cmp_123');

    expect(result).toMatchObject({ success: true });
    const { init } = getRequest(fetchMock);
    expect(init.body).toBeUndefined();
  });

  it('send() supports scheduled send', async () => {
    const fetchMock = installFetchMock([jsonResponse({ success: true, message: 'Scheduled' })]);
    const client = new MailGlyph('sk_test_123');

    await client.campaigns.send('cmp_123', { scheduledFor: '2026-03-01T10:00:00Z' });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).scheduledFor).toBe('2026-03-01T10:00:00Z');
  });

  it('cancel() cancels a scheduled campaign', async () => {
    installFetchMock([jsonResponse({ success: true, data: { ...campaign, status: 'DRAFT' }, message: 'Cancelled' })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.cancel('cmp_123');

    expect(result.success).toBe(true);
  });

  it('cancel() throws NotFoundError on missing campaign', async () => {
    installFetchMock([jsonResponse({ message: 'Campaign not found' }, 404)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.campaigns.cancel('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('test() sends campaign test email', async () => {
    installFetchMock([jsonResponse({ success: true, message: 'Test email sent' })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.test('cmp_123', 'preview@example.com');

    expect(result.success).toBe(true);
  });

  it('test() throws ValidationError when email missing', async () => {
    installFetchMock([jsonResponse({ message: 'email is required' }, 400)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.campaigns.test('cmp_123', '')).rejects.toBeInstanceOf(ValidationError);
  });

  it('stats() returns analytics payload', async () => {
    installFetchMock([jsonResponse({ success: true, data: { sent: 100, opens: 60, clicks: 25 } })]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.campaigns.stats('cmp_123');

    expect(result.data.opens).toBe(60);
  });

  it('stats() throws NotFoundError on missing campaign', async () => {
    installFetchMock([jsonResponse({ message: 'Campaign not found' }, 404)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.campaigns.stats('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});
