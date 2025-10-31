import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/errors.js';
import { createMockFetch, createTestClient, jsonResponse, toUrl } from './helpers.js';

describe('ContactsAPI', () => {
  it('lists contacts with filter parameters', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo) => {
      const url = toUrl(input);
      expect(url.pathname).toBe('/api/v1/contactBooks/book-1/contacts');
      expect(url.searchParams.get('limit')).toBe('50');
      expect(url.searchParams.get('emails')).toBe('a@example.com,b@example.com');
      expect(url.searchParams.get('ids')).toBe('1,2');
      return jsonResponse([]);
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const response = await client.contacts.list('book-1', {
      emails: ['a@example.com', 'b@example.com'],
      limit: 50,
      ids: ['1', '2'],
    });

    expect(response).toEqual([]);
  });

  it('creates contact', async () => {
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ email: 'user@example.com', firstName: 'First', subscribed: true });
      return jsonResponse({ contactId: 'contact-1' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const result = await client.contacts.create('book-1', {
      email: 'user@example.com',
      firstName: 'First',
      subscribed: true,
    });

    expect(result).toEqual({ contactId: 'contact-1' });
  });

  it('requires email when creating contact', async () => {
    const client = createTestClient(fetch as unknown as typeof fetch);
    await expect(client.contacts.create('book', { email: '' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('gets contact by id', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo) => {
      expect(toUrl(input).toString()).toBe(
        'https://app.mailrify.com/api/v1/contactBooks/book-1/contacts/contact-5',
      );
      return jsonResponse({ id: 'contact-5' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const contact = await client.contacts.get('book-1', 'contact-5');
    expect(contact).toMatchObject({ id: 'contact-5' });
  });

  it('upserts contact', async () => {
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('PUT');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ email: 'user@example.com' });
      return jsonResponse({ contactId: 'contact-5' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const result = await client.contacts.upsert('book-1', 'contact-5', {
      email: 'user@example.com',
    });
    expect(result).toEqual({ contactId: 'contact-5' });
  });

  it('updates contact partially', async () => {
    const fetchMock = createMockFetch(async (_input, init?: RequestInit) => {
      expect(init?.method).toBe('PATCH');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ subscribed: false });
      return jsonResponse({ contactId: 'contact-5' });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const result = await client.contacts.update('book-1', 'contact-5', { subscribed: false });
    expect(result).toEqual({ contactId: 'contact-5' });
  });

  it('deletes contact', async () => {
    const fetchMock = createMockFetch(async (input: RequestInfo, init?: RequestInit) => {
      expect(toUrl(input).toString()).toBe(
        'https://app.mailrify.com/api/v1/contactBooks/book-1/contacts/contact-5',
      );
      expect(init?.method).toBe('DELETE');
      return jsonResponse({ success: true });
    });

    const client = createTestClient(fetchMock as unknown as typeof fetch);
    const result = await client.contacts.delete('book-1', 'contact-5');
    expect(result).toEqual({ success: true });
  });
});
