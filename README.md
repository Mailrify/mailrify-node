# MailGlyph Node.js SDK

[![CI](https://github.com/MailGlyph/mailglyph-node/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MailGlyph/mailglyph-node/actions/workflows/ci.yml)
[![Release Please](https://github.com/MailGlyph/mailglyph-node/actions/workflows/release-please.yml/badge.svg?branch=main)](https://github.com/MailGlyph/mailglyph-node/actions/workflows/release-please.yml)

Official Node.js / TypeScript SDK for the MailGlyph API.

## Install

```bash
npm install mailglyph
```

```bash
yarn add mailglyph
```

## Initialize

```ts
import MailGlyph from 'mailglyph';

// Secret key client (all endpoints except /v1/track)
const client = new MailGlyph('sk_your_api_key');

// Public key client (/v1/track only)
const tracker = new MailGlyph('pk_your_public_key');
```

## Emails

```ts
// HTML + explicit text
const result = await client.emails.send({
  to: 'user@example.com',
  from: { name: 'My App', email: 'hello@myapp.com' },
  subject: 'Welcome!',
  body: '<h1>Hello {{name}}</h1>',
  text: 'Hello {{name}}',
  data: { name: 'John' }
});

// HTML only (backend auto-generates text from body)
await client.emails.send({
  to: 'user@example.com',
  from: 'hello@myapp.com',
  subject: 'HTML only',
  body: '<h1>Hello</h1><p>This is HTML-only content.</p>'
});

// HTML + text="" (opt out of text/plain part)
await client.emails.send({
  to: 'user@example.com',
  from: 'hello@myapp.com',
  subject: 'No text/plain part',
  body: '<h1>Hello</h1>',
  text: ''
});

const verification = await client.emails.verify('user@example.com');
console.log(verification.data.valid, verification.data.isRandomInput);
```

## Events

```ts
await tracker.events.track({
  email: 'user@example.com',
  event: 'purchase',
  data: { product: 'Premium', amount: 99 }
});

const { eventNames } = await client.events.listNames();
```

## Contacts

```ts
const { data, cursor, hasMore } = await client.contacts.list({ limit: 50 });
console.log(data.length, cursor, hasMore);

const contact = await client.contacts.create({
  email: 'user@example.com',
  data: { firstName: 'John', plan: 'premium' }
});

await client.contacts.update(contact.id, { subscribed: false });
await client.contacts.delete(contact.id);
```

## Templates

```ts
const templates = await client.templates.list({ type: 'TRANSACTIONAL', search: 'welcome' });
console.log(templates.data.length, templates.totalPages);

const template = await client.templates.create({
  name: 'Welcome',
  subject: 'Welcome!',
  body: '<h1>Welcome</h1>',
  type: 'TRANSACTIONAL'
});

await client.templates.update(template.id, { subject: 'Welcome to MailGlyph' });
await client.templates.delete(template.id);
```

## Segments

```ts
const segment = await client.segments.create({
  name: 'Premium Users',
  condition: {
    logic: 'AND',
    groups: [{ filters: [{ field: 'data.plan', operator: 'equals', value: 'premium' }] }]
  },
  trackMembership: true
});

const members = await client.segments.listContacts(segment.id, { page: 1 });

const addMembersResult = await client.segments.addStaticMembers(segment.id, {
  emails: ['alice@example.com', 'bob@example.com']
});
console.log(addMembersResult.added, addMembersResult.notFound);

const removeMembersResult = await client.segments.removeStaticMembers(segment.id, {
  emails: ['alice@example.com']
});
console.log(removeMembersResult.removed);
```

## Campaigns

```ts
const campaign = await client.campaigns.create({
  name: 'Product Launch',
  subject: 'Introducing our new feature!',
  body: '<h1>Big news!</h1><p>Check out our latest feature.</p>',
  from: 'hello@myapp.com',
  audienceType: 'FILTERED',
  audienceCondition: {
    logic: 'AND',
    groups: [{ filters: [{ field: 'subscribed', operator: 'equals', value: true }] }]
  }
});

const campaignPage = await client.campaigns.list({ page: 1, pageSize: 20, status: 'DRAFT' });
console.log(campaignPage.data.length, campaignPage.total);

await client.campaigns.send(campaign.id, {
  scheduledFor: '2026-03-01T10:00:00Z'
});

await client.campaigns.test(campaign.id, 'preview@myapp.com');

const stats = await client.campaigns.stats(campaign.id);
await client.campaigns.cancel(campaign.id);
```

## Configuration

```ts
const customClient = new MailGlyph('sk_your_api_key', {
  baseUrl: 'https://api.mailglyph.com',
  timeout: 30000
});
```

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
