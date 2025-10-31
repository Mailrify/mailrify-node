import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { Client } from '../../src/index.js';

const apiKey = process.env.MAILRIFY_API_KEY;
const baseUrl = process.env.MAILRIFY_BASE_URL;
const testFrom = process.env.MAILRIFY_TEST_FROM;
const testTo = process.env.MAILRIFY_TEST_TO;

const integration = apiKey && testFrom && testTo ? describe : describe.skip;

integration('Mailrify live API', () => {
  const client = new Client({
    apiKey: apiKey!,
    baseUrl,
    timeout: 30_000,
  });

  let emailId: string | undefined;

  it('lists domains', async () => {
    const domains = await client.domains.list();
    expect(Array.isArray(domains)).toBe(true);
  });

  it('lists emails', async () => {
    const emails = await client.emails.list();
    expect(emails).toHaveProperty('data');
    expect(Array.isArray(emails.data)).toBe(true);
  });

  it('sends an email and retrieves it', async () => {
    const response = await client.emails.send({
      from: testFrom!,
      to: testTo!,
      subject: `Mailrify SDK integration test ${Date.now()}`,
      text: 'Integration test email sent via SDK',
      html: '<p>Integration test email sent via SDK</p>',
    });

    expect(response.emailId).toBeDefined();
    emailId = response.emailId ?? undefined;

    expect(emailId).toBeTruthy();

    if (!emailId) {
      throw new Error('Email sending failed – no emailId returned.');
    }

    // Allow Mailrify to process the email before fetching
    await new Promise((resolve) => setTimeout(resolve, 2_000));

    const email = await client.emails.get(emailId);
    expect(email.id).toBe(emailId);
  });
});
