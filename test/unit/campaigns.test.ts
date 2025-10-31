import { describe, expect, it } from 'vitest';
import { createMockFetch, createTestClient, jsonResponse, toUrl } from './helpers.js';

describe('CampaignsAPI', () => {
  it('creates campaigns with optional schedule', async () => {
    const scheduledAt = new Date('2024-06-01T09:00:00.000Z');
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      const payload = JSON.parse(String(init?.body));
      expect(payload).toMatchObject({
        name: 'Launch',
        contactBookId: 'book-1',
        scheduledAt: scheduledAt.toISOString(),
      });
      return jsonResponse({ id: 'cmp-1' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.campaigns.create({
      name: 'Launch',
      from: 'noreply@example.com',
      subject: 'Launch campaign',
      contactBookId: 'book-1',
      html: '<p>Content</p>',
      scheduledAt,
    });

    expect(response).toEqual({ id: 'cmp-1' });
  });

  it('retrieves campaign details', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo) => {
      expect(toUrl(input).toString()).toBe('https://app.mailrify.com/api/v1/campaigns/cmp-1');
      return jsonResponse({ id: 'cmp-1', name: 'Launch' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.campaigns.get('cmp-1');
    expect(response).toMatchObject({ id: 'cmp-1' });
  });

  it('schedules campaign with natural language strings', async () => {
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ scheduledAt: 'tomorrow 9am' });
      return jsonResponse({ success: true });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.campaigns.schedule('cmp-1', { scheduledAt: 'tomorrow 9am' });
    expect(response).toEqual({ success: true });
  });

  it('pauses campaign', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo, init?: RequestInit) => {
      expect(toUrl(input).toString()).toBe('https://app.mailrify.com/api/v1/campaigns/cmp-1/pause');
      expect(init?.method).toBe('POST');
      return jsonResponse({ success: true });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.campaigns.pause('cmp-1');
    expect(response).toEqual({ success: true });
  });

  it('resumes campaign', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo, init?: RequestInit) => {
      expect(toUrl(input).toString()).toBe(
        'https://app.mailrify.com/api/v1/campaigns/cmp-1/resume',
      );
      expect(init?.method).toBe('POST');
      return jsonResponse({ success: true });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.campaigns.resume('cmp-1');
    expect(response).toEqual({ success: true });
  });
});
