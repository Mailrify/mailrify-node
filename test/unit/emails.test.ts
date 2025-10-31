import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/errors.js';
import type { SendEmailRequest } from '../../src/resources/emails.js';
import { createMockFetch, createTestClient, jsonResponse, toUrl } from './helpers.js';

describe('EmailsAPI', () => {
  it('sends an email with required fields', async () => {
    const payload = {
      to: 'user@example.com',
      from: 'sender@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
      text: 'Hello',
    };

    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify(payload));
      return jsonResponse({ emailId: 'email-123' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.emails.send(payload);
    expect(response).toEqual({ emailId: 'email-123' });
  });

  it('requires subject or templateId when sending', async () => {
    const client = createTestClient(fetch as unknown as typeof fetch);
    await expect(
      client.emails.send({
        to: 'user@example.com',
        from: 'sender@example.com',
        html: '<p>Missing subject</p>',
      } as unknown as SendEmailRequest),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('lists emails with query parameters', async () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-02T00:00:00.000Z');

    const fetchMock = createMockFetch(async (input: RequestInfo) => {
      const url = toUrl(input);
      expect(url.searchParams.get('startDate')).toBe(start.toISOString());
      expect(url.searchParams.get('endDate')).toBe(end.toISOString());
      expect(url.searchParams.getAll('domainId')).toEqual(['primary']);
      return jsonResponse({ data: [], count: 0 });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.emails.list({
      startDate: start,
      endDate: end,
      domainId: 'primary',
    });

    expect(response).toEqual({ data: [], count: 0 });
  });

  it('retrieves an email by id', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo) => {
      expect(toUrl(input).toString()).toBe('https://app.mailrify.com/api/v1/emails/email-1');
      return jsonResponse({ id: 'email-1' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const email = await client.emails.get('email-1');
    expect(email).toMatchObject({ id: 'email-1' });
  });

  it('updates schedule for an email', async () => {
    const scheduledAt = new Date('2024-05-01T12:00:00.000Z');
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('PATCH');
      expect(init?.body).toBe(JSON.stringify({ scheduledAt: scheduledAt.toISOString() }));
      return jsonResponse({ emailId: 'email-1' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.emails.schedule('email-1', scheduledAt);
    expect(response).toEqual({ emailId: 'email-1' });
  });

  it('cancels a scheduled email', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo, init?: RequestInit) => {
      expect(toUrl(input).toString()).toBe('https://app.mailrify.com/api/v1/emails/email-1/cancel');
      expect(init?.method).toBe('POST');
      return jsonResponse({ emailId: 'email-1' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.emails.cancel('email-1');
    expect(response).toEqual({ emailId: 'email-1' });
  });

  it('sends batch emails', async () => {
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      const body = JSON.parse(String(init?.body)) as unknown[];
      expect(body).toHaveLength(2);
      return jsonResponse({ data: [{ emailId: 'email-1' }] });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.emails.batch([
      {
        to: ['user@example.com'],
        from: 'sender@example.com',
        subject: 'Batch',
        html: '<p>Batch</p>',
        text: 'Batch',
      },
      {
        to: 'another@example.com',
        from: 'sender@example.com',
        templateId: 'tpl',
      },
    ]);

    expect(response).toEqual({ data: [{ emailId: 'email-1' }] });
  });
});
