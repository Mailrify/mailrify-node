import 'dotenv/config';

import { describe, expect, it } from 'vitest';

import MailGlyph, { MailGlyphError, NotFoundError } from '../../src';

const secretKey = process.env.MAILGLYPH_API_KEY;
const publicKey = process.env.MAILGLYPH_PUBLIC_KEY;
const baseUrl = process.env.MAILGLYPH_BASE_URL;
const testDomain = process.env.MAILGLYPH_TEST_DOMAIN ?? 'mailglyph.com';
const testMemberEmail = process.env.MAILGLYPH_TEST_MEMBER_EMAIL ?? 'info@mailglyph.com';

const hasIntegrationEnv = Boolean(secretKey && publicKey && baseUrl);
const maybeDescribe = hasIntegrationEnv ? describe : describe.skip;

maybeDescribe.sequential('integration: local MailGlyph API', () => {
  it(
    'runs SDK integration scenarios in order',
    async () => {
      const clientConfig: { baseUrl?: string } = {};
      if (baseUrl !== undefined) {
        clientConfig.baseUrl = baseUrl;
      }

      const secretClient = new MailGlyph(secretKey as string, clientConfig);
      const publicClient = new MailGlyph(publicKey as string, clientConfig);

      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const contactEmail = `sdk-integration-${uniqueId}@${testDomain}`;
      const eventEmail = `test@${testDomain}`;

      let createdContactId: string | undefined;
      let createdCampaignId: string | undefined;
      let createdSegmentId: string | undefined;

      try {
        await runStep('1. Email — Send', async () => {
          const sendResult = await secretClient.emails.send({
            to: testMemberEmail,
            from: `sdk-test@${testDomain}`,
            subject: 'SDK Integration Test',
            body: '<p>Test</p>'
          });

          expect(sendResult.success).toBe(true);
          expect(sendResult.data.emails[0]?.contact.id).toBeTruthy();
        });

        await runStep('2. Email — Verify', async () => {
          const verifyResult = await secretClient.emails.verify(`test@${testDomain}`);

          expect(verifyResult.success).toBe(true);
          expect(verifyResult.data.email).toBe(`test@${testDomain}`);
        });

        await runStep('3. Events — Track (pk_*)', async () => {
          const trackResult = await publicClient.events.track({
            email: eventEmail,
            event: 'sdk_test_event'
          });

          expect(trackResult.success).toBe(true);
        });

        await runStep('4. Events — Get Names (sk_*)', async () => {
          const eventNames = await waitForEventName(secretClient, 'sdk_test_event', 5, 500);

          expect(Array.isArray(eventNames)).toBe(true);
          expect(eventNames).toContain('sdk_test_event');
        });

        await runStep('5. Contacts — Full CRUD lifecycle', async () => {
          const created = await secretClient.contacts.create({
            email: contactEmail,
            data: { source: 'sdk-test' }
          });
          createdContactId = created.id;
          expect(created.id).toBeTruthy();
          expect(created.email).toBe(contactEmail);

          const fetched = await secretClient.contacts.get(created.id);
          expect(fetched.id).toBe(created.id);
          expect(fetched.email).toBe(contactEmail);

          const updated = await secretClient.contacts.update(created.id, {
            data: { source: 'sdk-test', updated: true }
          });
          expect(updated.data).toMatchObject({ source: 'sdk-test', updated: true });

          const listed = await secretClient.contacts.list({ limit: 10 });
          expect((listed.total ?? listed.data.length) > 0).toBe(true);

          const count = await secretClient.contacts.count();
          expect(count > 0).toBe(true);

          await secretClient.contacts.delete(created.id);
          createdContactId = undefined;

          await expect(secretClient.contacts.get(created.id)).rejects.toBeInstanceOf(NotFoundError);
        });

        await runStep('6. Campaigns — Full lifecycle', async () => {
          const createdCampaign = await secretClient.campaigns.create({
            name: `SDK Test Campaign ${uniqueId}`,
            subject: 'Test',
            body: '<p>Test</p>',
            from: `sdk-test@${testDomain}`,
            audienceType: 'ALL'
          });
          createdCampaignId = createdCampaign.id;

          const fetchedCampaign = await secretClient.campaigns.get(createdCampaign.id);
          expect(fetchedCampaign.status).toBe('DRAFT');

          const updatedCampaign = await secretClient.campaigns.update(createdCampaign.id, {
            subject: 'Updated Test'
          });
          expect(updatedCampaign.subject).toBe('Updated Test');

          const testResponse = await secretClient.campaigns.test(createdCampaign.id, testMemberEmail);
          expect(testResponse.success).toBe(true);

          const stats = await secretClient.campaigns.stats(createdCampaign.id);
          expect(stats.success).toBe(true);
          expect(typeof stats.data).toBe('object');
        });

        await runStep('7. Segments — Full CRUD lifecycle', async () => {
          const createdSegment = await secretClient.segments.create({
            name: `SDK Test Segment ${uniqueId}`,
            condition: {
              logic: 'AND',
              groups: [
                {
                  filters: [{ field: 'subscribed', operator: 'equals', value: true }]
                }
              ]
            }
          });
          createdSegmentId = createdSegment.id;

          const fetchedSegment = await secretClient.segments.get(createdSegment.id);
          expect(fetchedSegment.name).toBe(`SDK Test Segment ${uniqueId}`);

          const updatedSegment = await secretClient.segments.update(createdSegment.id, {
            name: `Updated SDK Test Segment ${uniqueId}`
          });
          expect(updatedSegment.name).toBe(`Updated SDK Test Segment ${uniqueId}`);

          const segments = await secretClient.segments.list();
          expect(segments.some((segment) => segment.id === createdSegment.id)).toBe(true);

          const segmentContacts = await secretClient.segments.listContacts(createdSegment.id, {
            page: 1,
            pageSize: 20
          });
          expect(Array.isArray(segmentContacts.data)).toBe(true);
          expect(typeof segmentContacts.total).toBe('number');

          await secretClient.segments.delete(createdSegment.id);
          createdSegmentId = undefined;
        });
      } finally {
        await cleanupResource('contact', createdContactId, async (id) => {
          await secretClient.contacts.delete(id);
        });

        await cleanupResource('segment', createdSegmentId, async (id) => {
          await secretClient.segments.delete(id);
        });

        if (createdCampaignId) {
          console.info(
            `[cleanup] campaign ${createdCampaignId} not deleted: API currently has no campaign delete endpoint.`
          );
        }
      }
    },
    120_000
  );
});

async function runStep<T>(step: string, fn: () => Promise<T>): Promise<T> {
  console.info(`[start] ${step}`);
  try {
    const result = await fn();
    console.info(`[pass] ${step}`);
    return result;
  } catch (error) {
    throw new Error(formatStepError(step, error));
  }
}

async function waitForEventName(
  client: MailGlyph,
  expectedName: string,
  maxAttempts: number,
  delayMs: number
): Promise<string[]> {
  let lastNames: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await client.events.listNames();
    lastNames = result.eventNames;

    if (lastNames.includes(expectedName)) {
      return lastNames;
    }

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  return lastNames;
}

async function cleanupResource(
  label: string,
  id: string | undefined,
  cleanup: (id: string) => Promise<void>
): Promise<void> {
  if (!id) {
    return;
  }

  try {
    console.info(`[cleanup] deleting ${label} ${id}`);
    await cleanup(id);
    console.info(`[cleanup] deleted ${label} ${id}`);
  } catch (error) {
    console.error(`[cleanup] failed to delete ${label} ${id}: ${formatCleanupError(error)}`);
  }
}

function formatStepError(step: string, error: unknown): string {
  if (error instanceof MailGlyphError) {
    return `${step} failed | status=${error.status ?? 'unknown'} | body=${safeStringify(error.details)} | message=${error.message}`;
  }

  if (error instanceof Error) {
    return `${step} failed | ${error.message}`;
  }

  return `${step} failed | ${String(error)}`;
}

function formatCleanupError(error: unknown): string {
  if (error instanceof MailGlyphError) {
    return `status=${error.status ?? 'unknown'} body=${safeStringify(error.details)} message=${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
