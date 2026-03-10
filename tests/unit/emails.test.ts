import { afterEach, describe, expect, it, vi } from 'vitest';

import MailGlyph, { ValidationError } from '../../src';
import type { SendEmailParams } from '../../src';
import { getRequest, installFetchMock, jsonResponse } from './test-utils';

describe('emails resource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('send() supports simple string to/from', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({
        success: true,
        data: { emails: [{ contact: { id: 'c1', email: 'user@example.com' }, email: 'e1' }], timestamp: '2026-01-01T00:00:00Z' }
      })
    ]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.emails.send({
      to: 'user@example.com',
      from: 'hello@example.com',
      subject: 'Hello',
      body: '<p>Hi</p>'
    });

    expect(result.success).toBe(true);
    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body))).toMatchObject({ to: 'user@example.com', from: 'hello@example.com' });
  });

  it('send() supports object to/from with names', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { emails: [], timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('sk_test_123');

    await client.emails.send({
      to: { name: 'Jane', email: 'jane@example.com' },
      from: { name: 'Acme', email: 'hello@example.com' },
      subject: 'Hello'
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body))).toMatchObject({
      to: { name: 'Jane', email: 'jane@example.com' },
      from: { name: 'Acme', email: 'hello@example.com' }
    });
  });

  it('send() supports array of recipients', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { emails: [], timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('sk_test_123');

    await client.emails.send({
      to: ['one@example.com', { name: 'Two', email: 'two@example.com' }],
      from: 'hello@example.com',
      subject: 'Hello'
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).to).toHaveLength(2);
  });

  it('send() supports template data', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { emails: [], timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('sk_test_123');

    await client.emails.send({
      to: 'user@example.com',
      from: 'hello@example.com',
      template: 'tmpl_123',
      data: { firstName: 'John' }
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body))).toMatchObject({ template: 'tmpl_123', data: { firstName: 'John' } });
  });

  it('send() supports attachments', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { emails: [], timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('sk_test_123');

    await client.emails.send({
      to: 'user@example.com',
      from: 'hello@example.com',
      subject: 'Invoice',
      attachments: [
        {
          filename: 'invoice.pdf',
          content: 'JVBERi0xLjQ=',
          contentType: 'application/pdf'
        }
      ]
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).attachments[0].filename).toBe('invoice.pdf');
  });

  it('send() includes text when provided', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { emails: [], timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('sk_test_123');

    await client.emails.send({
      to: 'user@example.com',
      from: 'hello@example.com',
      body: '<p>Hi</p>',
      text: 'Hi'
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).text).toBe('Hi');
  });

  it('send() omits text when undefined', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { emails: [], timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('sk_test_123');
    const text: string | undefined = undefined;

    await client.emails.send({
      to: 'user@example.com',
      from: 'hello@example.com',
      body: '<p>Hi</p>',
      ...(text !== undefined ? { text } : {})
    });

    const { init } = getRequest(fetchMock);
    const payload = JSON.parse(String(init.body)) as { text?: string };
    expect('text' in payload).toBe(false);
  });

  it('send() sends empty string when text is empty string', async () => {
    const fetchMock = installFetchMock([
      jsonResponse({ success: true, data: { emails: [], timestamp: '2026-01-01T00:00:00Z' } })
    ]);
    const client = new MailGlyph('sk_test_123');

    await client.emails.send({
      to: 'user@example.com',
      from: 'hello@example.com',
      body: '<p>Hi</p>',
      text: ''
    });

    const { init } = getRequest(fetchMock);
    expect(JSON.parse(String(init.body)).text).toBe('');
  });

  it('send() throws ValidationError on 400', async () => {
    installFetchMock([jsonResponse({ message: 'to is required' }, 400)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.emails.send({ from: 'hello@example.com' } as SendEmailParams)).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it('verify() returns full result including isRandomInput', async () => {
    installFetchMock([
      jsonResponse({
        success: true,
        data: {
          email: 'user@gmail.com',
          valid: true,
          isDisposable: false,
          isAlias: false,
          isTypo: false,
          isPlusAddressed: false,
          isRandomInput: false,
          isPersonalEmail: true,
          domainExists: true,
          hasWebsite: true,
          hasMxRecords: true,
          reasons: ['Email appears to be valid']
        }
      })
    ]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.emails.verify('user@gmail.com');

    expect(result.data.isRandomInput).toBe(false);
    expect(result.data.valid).toBe(true);
  });

  it('verify() handles typo suggestions', async () => {
    installFetchMock([
      jsonResponse({
        success: true,
        data: {
          email: 'user@gmial.com',
          valid: false,
          isDisposable: false,
          isAlias: false,
          isTypo: true,
          isPlusAddressed: false,
          isRandomInput: false,
          isPersonalEmail: false,
          domainExists: false,
          hasWebsite: false,
          hasMxRecords: false,
          suggestedEmail: 'user@gmail.com',
          reasons: ['Possible typo detected']
        }
      })
    ]);
    const client = new MailGlyph('sk_test_123');

    const result = await client.emails.verify('user@gmial.com');

    expect(result.data.isTypo).toBe(true);
    expect(result.data.suggestedEmail).toBe('user@gmail.com');
  });

  it('verify() throws ValidationError on invalid email', async () => {
    installFetchMock([jsonResponse({ message: 'Invalid email format' }, 400)]);
    const client = new MailGlyph('sk_test_123');

    await expect(client.emails.verify('bad')).rejects.toBeInstanceOf(ValidationError);
  });
});
