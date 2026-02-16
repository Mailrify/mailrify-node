# Mailrify Node.js SDK

[![CI](https://github.com/Mailrify/mailrify-node/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Mailrify/mailrify-node/actions/workflows/ci.yml)
[![Release Please](https://github.com/Mailrify/mailrify-node/actions/workflows/release-please.yml/badge.svg?branch=main)](https://github.com/Mailrify/mailrify-node/actions/workflows/release-please.yml)

Official Node.js / TypeScript SDK for the Mailrify API.

## Install

```bash
npm install mailrify
```

```bash
yarn add mailrify
```

## Initialize

```ts
import Mailrify from 'mailrify';

// Secret key client (all endpoints except /v1/track)
const client = new Mailrify('sk_your_api_key');

// Public key client (/v1/track only)
const tracker = new Mailrify('pk_your_public_key');
```

## Emails

```ts
const result = await client.emails.send({
  to: 'user@example.com',
  from: { name: 'My App', email: 'hello@myapp.com' },
  subject: 'Welcome!',
  body: '<h1>Hello {{name}}</h1>',
  data: { name: 'John' }
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
const { contacts, cursor, hasMore } = await client.contacts.list({ limit: 50 });

const contact = await client.contacts.create({
  email: 'user@example.com',
  data: { firstName: 'John', plan: 'premium' }
});

await client.contacts.update(contact.id, { subscribed: false });
await client.contacts.delete(contact.id);
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
const customClient = new Mailrify('sk_your_api_key', {
  baseUrl: 'https://api.mailrify.com',
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
