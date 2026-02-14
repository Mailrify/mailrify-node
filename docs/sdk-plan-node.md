# Mailrify Node.js / TypeScript SDK Plan

> Shared spec: [sdk-plan.md](./sdk-plan.md) · Repo: [Mailrify/mailrify-node](https://github.com/Mailrify/mailrify-node) · Registry: [npm `mailrify`](https://www.npmjs.com/package/mailrify) · Min: Node 18+

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Language | TypeScript (strict) |
| HTTP | Native `fetch` (Node 18+) |
| Testing | `vitest` |
| Bundler | `tsup` (ESM-first, CJS compat) |
| Linting | ESLint + Prettier |
| Type checking | `tsc --noEmit` |

---

## Repository Structure

```
mailrify-node/
├── src/
│   ├── index.ts                 # Main export: Mailrify class
│   ├── client.ts                # Client config & initialization
│   ├── http.ts                  # HttpClient (fetch-based)
│   ├── errors.ts                # Error classes
│   ├── types.ts                 # All TypeScript interfaces/types
│   └── resources/
│       ├── emails.ts
│       ├── events.ts
│       ├── contacts.ts
│       ├── campaigns.ts
│       └── segments.ts
├── tests/
│   ├── unit/
│   │   ├── emails.test.ts
│   │   ├── events.test.ts
│   │   ├── contacts.test.ts
│   │   ├── campaigns.test.ts
│   │   ├── segments.test.ts
│   │   ├── http.test.ts
│   │   └── errors.test.ts
│   └── integration/
│       └── api.test.ts
├── openapi.json                 # Copy of spec for reference
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.cjs
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release-please.yml
│       └── publish.yml
├── release-please-config.json
├── .release-please-manifest.json
├── AGENTS.md
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## Type Definitions (`src/types.ts`)

Key interfaces to define:

```typescript
// Client config
interface MailrifyConfig {
  apiKey: string;
  baseUrl?: string;  // default: https://api.mailrify.com
  timeout?: number;  // default: 30000
}

// Emails
interface SendEmailParams {
  to: string | { name?: string; email: string } | Array<string | { name?: string; email: string }>;
  from: string | { name?: string; email: string };
  subject?: string;
  body?: string;
  template?: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  reply?: string;
  name?: string;
  subscribed?: boolean;
  attachments?: Array<{ filename: string; content: string; contentType: string }>;
}

interface SendEmailResponse {
  success: boolean;
  data: {
    emails: Array<{ contact: { id: string; email: string }; email: string }>;
    timestamp: string;
  };
}

interface VerifyEmailResponse {
  success: boolean;
  data: {
    email: string;
    valid: boolean;
    isDisposable: boolean;
    isAlias: boolean;
    isTypo: boolean;
    isPlusAddressed: boolean;
    isRandomInput: boolean;
    isPersonalEmail: boolean;
    domainExists: boolean;
    hasWebsite: boolean;
    hasMxRecords: boolean;
    suggestedEmail?: string | null;
    reasons: string[];
  };
}

// Events
interface TrackEventParams {
  email: string;
  event: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
}

// Contacts
interface Contact {
  id: string;
  email: string;
  subscribed: boolean;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ListContactsParams {
  limit?: number;
  cursor?: string;
  subscribed?: boolean;
  search?: string;
}

interface CreateContactParams {
  email: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
}

interface UpdateContactParams {
  subscribed?: boolean;
  data?: Record<string, unknown>;
}

// Segments
interface Segment {
  id: string;
  name: string;
  description?: string | null;
  condition: Record<string, unknown>;
  trackMembership: boolean;
  memberCount: number;
}

interface CreateSegmentParams {
  name: string;
  condition: Record<string, unknown>;
  description?: string;
  trackMembership?: boolean;
}

interface UpdateSegmentParams {
  name?: string;
  description?: string;
  condition?: Record<string, unknown>;
  trackMembership?: boolean;
}

interface ListSegmentContactsParams {
  page?: number;
  pageSize?: number;
}

// Campaigns
type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT';
type AudienceType = 'ALL' | 'SEGMENT' | 'FILTERED';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  type: AudienceType;
  status: CampaignStatus;
  scheduledAt?: string | null;
}

interface ListCampaignsParams {
  limit?: number;
  cursor?: string;
  status?: CampaignStatus;
}

interface CreateCampaignParams {
  name: string;
  subject: string;
  body: string;
  from: string;
  audienceType: AudienceType;
  description?: string;
  fromName?: string;
  replyTo?: string;
  segmentId?: string;
  audienceFilter?: Record<string, unknown>;
}

interface UpdateCampaignParams {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  audienceType?: AudienceType;
  segmentId?: string;
  audienceCondition?: Record<string, unknown>;
}

interface SendCampaignParams {
  scheduledFor?: string | null; // ISO 8601, omit for immediate
}
```

---

## Test Commands

| Scope | Command |
|-------|---------|
| Unit | `npm test` |
| Integration | `MAILRIFY_API_KEY=sk_... npm run test:integration` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

---

## `package.json` key fields

```json
{
  "name": "mailrify",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:integration": "vitest run tests/integration",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Usage Examples (for README)

```typescript
import Mailrify from 'mailrify';

// Initialize with secret key
const client = new Mailrify('sk_your_api_key');

// Send email
const result = await client.emails.send({
  to: 'user@example.com',
  from: { name: 'My App', email: 'hello@myapp.com' },
  subject: 'Welcome!',
  body: '<h1>Hello {{name}}</h1>',
  data: { name: 'John' },
});

// Verify email
const verification = await client.emails.verify('user@example.com');
console.log(verification.data.valid, verification.data.isRandomInput);

// Track event (use public key)
const tracker = new Mailrify('pk_your_public_key');
await tracker.events.track({
  email: 'user@example.com',
  event: 'purchase',
  data: { product: 'Premium', amount: 99 },
});

// List event names (secret key)
const { eventNames } = await client.events.listNames();

// Contacts CRUD
const { contacts, cursor, hasMore } = await client.contacts.list({ limit: 50 });
const contact = await client.contacts.create({
  email: 'user@example.com',
  data: { firstName: 'John', plan: 'premium' },
});
await client.contacts.update(contact.id, { subscribed: false });
await client.contacts.delete(contact.id);

// Segments
const segment = await client.segments.create({
  name: 'Premium Users',
  condition: {
    operator: 'AND',
    conditions: [{ field: 'data.plan', operator: 'equals', value: 'premium' }],
  },
  trackMembership: true,
});
const { data: members } = await client.segments.listContacts(segment.id, { page: 1 });

// Campaigns
const campaign = await client.campaigns.create({
  name: 'Product Launch',
  subject: 'Introducing our new feature!',
  body: '<h1>Big news!</h1><p>Check out our latest feature.</p>',
  from: 'hello@myapp.com',
  audienceType: 'ALL',
});

// Schedule for later
await client.campaigns.send(campaign.id, {
  scheduledFor: '2026-03-01T10:00:00Z',
});

// Send test email first
await client.campaigns.test(campaign.id, 'preview@myapp.com');

// Get stats
const stats = await client.campaigns.stats(campaign.id);

// Cancel scheduled campaign
await client.campaigns.cancel(campaign.id);
```

---

## Release Automation

### `release-please-config.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "release-type": "node",
      "bump-minor-pre-major": true,
      "bump-patch-for-minor-pre-major": true
    }
  }
}
```

### `.release-please-manifest.json`

```json
{
  ".": "0.1.0"
}
```

### `.github/workflows/release-please.yml`

```yaml
name: Release Please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          release-type: node
```

### `.github/workflows/publish.yml`

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # for npm provenance
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
