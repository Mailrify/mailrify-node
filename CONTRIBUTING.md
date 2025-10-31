# Contributing to the Mailrify Node.js SDK

We welcome contributions that improve the developer experience, reliability, and test coverage of the SDK. To keep the project maintainable, please follow the guidelines below.

## Getting Started

1. Ensure you are using Node.js 18 or later.
2. Install dependencies with `npm install`.
3. Run `npm run test:unit` to confirm the existing test suite passes before making changes.

## Development Workflow

1. Fork the repository and create a topic branch (`feat/...`, `fix/...`).
2. Make your changes with accompanying unit tests. Every public method must remain covered.
3. Run `npm run lint` and `npm run test:unit`. If you have access to live credentials, run `npm run test:integration` as well.
4. Update documentation (`README.md`, examples, CHANGELOG) when you modify or add public functionality.
5. Open a pull request describing the problem, solution, and any follow-up work that might be required.

## Commit & PR Guidelines

- Keep commits focused and readable; prefer meaningful messages over generic ones.
- Reference related issues when applicable.
- Include before/after context or screenshots for non-trivial changes.
- Add tests for bug fixes and new features. If a test is impractical, explain why in the PR.

## Code Style

- TypeScript only (`strict` mode enabled). Avoid `any` in public APIs.
- Minimize runtime dependencies—prefer the standard library and simple utility functions.
- Use ESLint and Prettier (`npm run lint:fix`, `npm run format:fix`).
- Write concise comments only where the intent is not obvious.

## Reporting Issues

Use the GitHub issue templates for bug reports and feature requests. Include SDK version, Node.js version, reproduction steps, and relevant logs.

## Security

Please do not file public issues for vulnerabilities. Instead, follow the process outlined in [SECURITY.md](./SECURITY.md).

Thanks for contributing to Mailrify!
