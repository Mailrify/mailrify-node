# Changelog

## Unreleased

### ⚠ BREAKING CHANGES

* `contacts.list()` now returns `{ data, cursor, hasMore, total }` instead of `{ contacts, ... }`.
* `Contact` schema now includes `status`, `expiresAt`, `projectId`, and `data` is nullable.
* `Segment` schema now includes `type`, and `condition` is nullable.

### Features

* add `templates` resource (`list`, `create`, `get`, `update`, `delete`) aligned with `/templates` endpoints.

### Bug Fixes

* align `campaigns.send()` response to `{ success, data, message }` with typed `data: Campaign`.
* align `/templates` list response typing to `{ data, total, page, pageSize, totalPages }`.

## [1.2.0](https://github.com/MailGlyph/mailglyph-node/compare/v1.1.2...v1.2.0) (2026-03-26)


### Features

* add Templates resource and update OpenAPI spec with enhanced schemas for Contacts, Templates, and Campaigns ([c97ca12](https://github.com/MailGlyph/mailglyph-node/commit/c97ca12bbb144262ebf0ee5005aa11d728a68bb1))

## [1.1.2](https://github.com/MailGlyph/mailglyph-node/compare/v1.1.1...v1.1.2) (2026-03-10)


### Bug Fixes

* trigger next release ([6fbc3af](https://github.com/MailGlyph/mailglyph-node/commit/6fbc3af1a979c02811cba3db73c09fc0d20448a8))

## [1.1.1](https://github.com/MailGlyph/mailglyph-node/compare/v1.1.0...v1.1.1) (2026-03-10)


### Bug Fixes

* read from dot env ([3209951](https://github.com/MailGlyph/mailglyph-node/commit/3209951240171cb13e53487066a975d82e81c892))

## [1.1.0](https://github.com/MailGlyph/mailglyph-node/compare/v1.0.2...v1.1.0) (2026-03-02)


### Features

* Add `text` field to email sending parameters. ([83b71a8](https://github.com/MailGlyph/mailglyph-node/commit/83b71a80e3fb02a93d965283e1da260d244bff15))
* Implement methods to add and remove contacts from static segments, along with supporting types and documentation. ([5775f98](https://github.com/MailGlyph/mailglyph-node/commit/5775f9828d1ae808d72f92342a080ed59376188f))

## [1.0.2](https://github.com/MailGlyph/mailglyph-node/compare/v1.0.1...v1.0.2) (2026-02-16)


### Bug Fixes

* add manual oidc publish path to release-please workflow ([26b3e37](https://github.com/MailGlyph/mailglyph-node/commit/26b3e3762ca7663c2136966976b728f96684eb8d))
* add repository metadata for npm provenance validation ([8c84a57](https://github.com/MailGlyph/mailglyph-node/commit/8c84a57a195846295066a3f46103b713c0f303b0))
* align npm trusted publishing workflows with npm docs ([2063103](https://github.com/MailGlyph/mailglyph-node/commit/2063103ff35d04c0780a850fb161c36531f45202))
* enable oidc token at workflow level for npm trusted publishing ([fff9269](https://github.com/MailGlyph/mailglyph-node/commit/fff9269587b1d622d25caf9285adb963fd3f0005))
* enforce tokenless npm publish for oidc workflow runs ([a4a110e](https://github.com/MailGlyph/mailglyph-node/commit/a4a110e5be24dca86293688f0d8566bec0645721))
* force tokenless npm trusted publishing via oidc ([b034244](https://github.com/MailGlyph/mailglyph-node/commit/b034244885f855df1b91bd6f4c9a27adc11da271))
* set repository metadata before npm publish for tagged releases ([008a6f4](https://github.com/MailGlyph/mailglyph-node/commit/008a6f48b01b9068651395aab51156f77f7060cd))

## [1.0.1](https://github.com/MailGlyph/mailglyph-node/compare/v1.0.0...v1.0.1) (2026-02-16)


### Bug Fixes

* publish npm from release-please workflow ([e14d055](https://github.com/MailGlyph/mailglyph-node/commit/e14d055a7ec0fbfc76599a7aa92a6bb18b6f6e29))

## [1.0.0](https://github.com/MailGlyph/mailglyph-node/compare/v0.1.1...v1.0.0) (2026-02-16)


### ⚠ BREAKING CHANGES

* complete API redesign, not compatible with 0.1.x

### Features

* initial SDK implementation ([59d1684](https://github.com/MailGlyph/mailglyph-node/commit/59d16849f91aaea3057ef436e63671d0aa9f5711))


### Bug Fixes

* set release-please target branch to main ([47cbb02](https://github.com/MailGlyph/mailglyph-node/commit/47cbb02d84bc7f77c1988a5e8373bee1acfe6000))

## Changelog

All notable changes to this project will be documented in this file.
