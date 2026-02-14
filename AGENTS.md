# AGENTS.md

## Project
This is the official Mailrify Node.js / TypeScript SDK. See `./docs/` for the full specification.

## Context Files (read these FIRST)
1. [sdk-plan.md](./docs/sdk-plan.md) — Shared API spec, all 22 endpoints, auth rules, error hierarchy, testing strategy, release-please setup
2. [sdk-plan-node.md](./docs/sdk-plan-node.md) — Node.js/TypeScript-specific implementation plan (structure, types, workflows)
3. [openapi.json](./docs/openapi.json) — OpenAPI 3.0.3 specification (source of truth for schemas)

## Build Order
1. Scaffold: `package.json` (name: `mailrify`), `tsconfig.json`, `tsup.config.ts`, `.gitignore`
2. Types (`src/types.ts`) — all request/response interfaces from the plan
3. Error classes (`src/errors.ts`) — `MailrifyError`, `AuthenticationError`, `ValidationError`, `NotFoundError`, `RateLimitError`, `ApiError`
4. HttpClient (`src/http.ts`) — native `fetch`, Bearer auth, JSON parsing, error mapping, retry with exponential backoff for 429/5xx
5. Client (`src/index.ts`) — default export, accepts API key + config, exposes `.emails`, `.events`, `.contacts`, `.campaigns`, `.segments`
6. Resources one at a time with vitest tests:
   - Emails (send, verify) → tests
   - Events (track with `pk_*` support, getNames) → tests
   - Contacts (list, create, get, update, delete, count) → tests
   - Campaigns (list, create, get, update, send, cancel, test, stats) → tests
   - Segments (list, create, get, update, delete, listContacts) → tests
7. CI: [.github/workflows/ci.yml](cci:7://file:///Users/sharo/Library/CloudStorage/Dropbox/Projects/Plunk/plunk/.github/workflows/ci.yml:0:0-0:0), `release-please.yml`, `publish.yml`
8. README with install + usage examples
9. Run `npm test` — all tests must pass

## Standards
- TypeScript strict mode, ESM-first with CJS fallback (dual package via tsup)
- Node 18+ (native fetch, no axios)
- vitest for testing with mocked fetch responses
- Consistent type imports: `import type { ... }`
- Conventional Commits for all commit messages
