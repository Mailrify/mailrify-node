# Mailrify Node.js SDK

[![CI](https://github.com/Mailrify/mailrify-node/actions/workflows/ci.yml/badge.svg)](https://github.com/Mailrify/mailrify-node/actions/workflows/ci.yml) 
[![Release](https://github.com/mailrify/mailrify-node/actions/workflows/release.yml/badge.svg)](https://github.com/mailrify/mailrify-node/actions/workflows/release.yml)


Official TypeScript SDK for the [Mailrify](https://mailrify.com) transactional and marketing email API. The SDK provides a thin, type-safe wrapper over the Mailrify REST endpoints generated from the public OpenAPI contract.

## Features

- ✅ Fully typed request/response models generated from the central [`mailrify-openapi`](https://github.com/Mailrify/mailrify-openapi) specification
- 🔐 Automatic Bearer authentication and sensible default headers
- 💡 Friendly resource namespaces (`client.emails.send`, `client.domains.verify`, etc.)
- ♻️ Optional retries for idempotent requests and pluggable interceptors for observability
- 🧪 Comprehensive unit tests with mocked HTTP + opt-in integration tests against live APIs
- 📦 Dual ESM/CJS distribution with strict TypeScript configuration (Node.js ≥ 18)

## Installation

```bash
npm install mailrify
# or
yarn add mailrify
# or
pnpm add mailrify
```

> **Requirements:** Node.js 18 or higher (native `fetch` support) and an API key from the Mailrify dashboard.

## Quickstart

```ts
import { Client } from 'mailrify';

const mailrify = new Client({ 
  apiKey: 'YOUR_API_KEY',
  // Optional overrides:
  // baseUrl: 'https://app.mailrify.com/api',
  // timeout: 30_000,
  // userAgent: 'my-app/1.0.0',
});

const sendEmail = async () => {
  const response = await mailrify.emails.send({
    from: 'Your app <no-reply@yourdomain.com>',
    to: 'client@example.com',
    subject: 'Welcome to Mailrify 🚀',
    html: '<p>It works! 👋</p>',
    text: 'It works!',
  });

  console.log('Mailrify email queued:', response);
};

sendEmail().catch((error) => {
  console.error('Failed to send email with Mailrify:', error);
});
```

## Configuration

| Option         | Type                              | Default                        | Description                                                       |
| -------------- | --------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `apiKey`       | `string`                          | _required_                     | Mailrify API key used for Bearer authentication.                  |
| `baseUrl`      | `string`                          | `https://app.mailrify.com/api` | Override API endpoint (useful for staging/sandbox).               |
| `timeout`      | `number`                          | `30_000`                       | Request timeout in milliseconds.                                  |
| `maxRetries`   | `number`                          | `2`                            | Number of additional attempts for idempotent requests (GET/HEAD). |
| `retryDelayMs` | `number`                          | `500`                          | Base delay for exponential backoff between retries.               |
| `fetch`        | `typeof fetch`                    | `globalThis.fetch`             | Custom fetch implementation (handy for tests or polyfills).       |
| `headers`      | `Record<string, string>`          | `{}`                           | Extra headers appended to every request.                          |
| `interceptors` | `{ request?, response?, error? }` | `undefined`                    | Hook into requests/responses for logging, tracing, etc.           |
| `debug`        | `boolean`                         | `false`                        | Emit sanitized request/response metadata via `console.debug`.     |
| `userAgent`    | `string`                          | `undefined`                    | Append a custom `user-agent` header (Node.js environments only).  |

## API Coverage

Every operation defined in [`mailrify-openapi`](https://github.com/Mailrify/mailrify-openapi) has a corresponding method:

| SDK Method                                           | HTTP   | Endpoint                                                |
| ---------------------------------------------------- | ------ | ------------------------------------------------------- |
| `client.domains.list()`                              | GET    | `/v1/domains`                                           |
| `client.domains.create()`                            | POST   | `/v1/domains`                                           |
| `client.domains.get(id)`                             | GET    | `/v1/domains/{id}`                                      |
| `client.domains.verify(id)`                          | PUT    | `/v1/domains/{id}/verify`                               |
| `client.domains.delete(id)`                          | DELETE | `/v1/domains/{id}`                                      |
| `client.emails.send(payload)`                        | POST   | `/v1/emails`                                            |
| `client.emails.batch(requests)`                      | POST   | `/v1/emails/batch`                                      |
| `client.emails.get(emailId)`                         | GET    | `/v1/emails/{emailId}`                                  |
| `client.emails.list(filters)`                        | GET    | `/v1/emails`                                            |
| `client.emails.schedule(id, scheduledAt)`            | PATCH  | `/v1/emails/{emailId}`                                  |
| `client.emails.cancel(id)`                           | POST   | `/v1/emails/{emailId}/cancel`                           |
| `client.contacts.list(bookId, filters)`              | GET    | `/v1/contactBooks/{contactBookId}/contacts`             |
| `client.contacts.create(bookId, payload)`            | POST   | `/v1/contactBooks/{contactBookId}/contacts`             |
| `client.contacts.get(bookId, contactId)`             | GET    | `/v1/contactBooks/{contactBookId}/contacts/{contactId}` |
| `client.contacts.upsert(bookId, contactId, payload)` | PUT    | `/v1/contactBooks/{contactBookId}/contacts/{contactId}` |
| `client.contacts.update(bookId, contactId, payload)` | PATCH  | `/v1/contactBooks/{contactBookId}/contacts/{contactId}` |
| `client.contacts.delete(bookId, contactId)`          | DELETE | `/v1/contactBooks/{contactBookId}/contacts/{contactId}` |
| `client.campaigns.create(payload)`                   | POST   | `/v1/campaigns`                                         |
| `client.campaigns.get(id)`                           | GET    | `/v1/campaigns/{campaignId}`                            |
| `client.campaigns.schedule(id, payload)`             | POST   | `/v1/campaigns/{campaignId}/schedule`                   |
| `client.campaigns.pause(id)`                         | POST   | `/v1/campaigns/{campaignId}/pause`                      |
| `client.campaigns.resume(id)`                        | POST   | `/v1/campaigns/{campaignId}/resume`                     |

## Error Handling

All non-success responses throw subclasses of `MailrifyError`:

- `HTTPError` – generic HTTP failure (status ≥ 400)
- `AuthError` – authentication/authorization issues (401 / 403)
- `RateLimitError` – 429 responses; includes `retryAfter` (ms) when available
- `ValidationError` – client-side validation before the request is dispatched

Each error exposes `status`, `code`, `details`, and `requestId` when provided by the API. Catch them to implement retry/backoff logic or to surface rich context to users.

```ts
try {
  await mailrify.emails.send(...);
} catch (error) {
  if (error instanceof MailrifyError) {
    console.error('Mailrify request failed', {
      status: error.status,
      code: error.code,
      requestId: error.requestId,
    });
  }
}
```

## Testing

Unit tests use mocked HTTP responses to exercise every public SDK method:

```bash
npm run test:unit
```

Integration tests hit the live API and are skipped unless credentials are provided. Copy `.env.example` to `.env`, set the variables, then run:

```bash
cp .env.example .env
# edit .env to populate MAILRIFY_API_KEY, MAILRIFY_TEST_FROM, MAILRIFY_TEST_TO (and optional MAILRIFY_BASE_URL)
npm run test:integration
```

## Development

Common tasks:

- `npm run lint` – ESLint + Prettier formatting checks
- `npm run format:fix` – Auto-format source files
- `npm run build` – Generate OpenAPI types and compile ESM/CJS outputs
- `npm run generate:types` – Download `openapi.yaml` from the central repo and regenerate `src/types/openapi.ts`

### OpenAPI Source

- The currently synced spec version is recorded in `spec-version.json` (includes the source URL and fetch time).
- To regenerate types from a specific release, set `MAILRIFY_OPENAPI_URL` before running `npm run generate:types`, e.g.
  ```bash
  MAILRIFY_OPENAPI_URL=https://raw.githubusercontent.com/Mailrify/mailrify-openapi/v1.0.0/openapi.yaml npm run generate:types
  ```

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install` (Node.js ≥ 18).
3. Run `npm run lint` and `npm run test:unit` before submitting a PR.
4. For significant changes, add entries to `CHANGELOG.md` and update documentation/examples.

Please open issues or discussions for large feature requests before beginning implementation.

## Security

Security vulnerabilities can be reported privately via security@mailrify.com. See [SECURITY.md](./SECURITY.md) for details.

## License

Distributed under the [MIT License](./LICENSE).
