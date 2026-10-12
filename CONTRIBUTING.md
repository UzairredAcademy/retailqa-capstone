# Contributing

## Naming
- Test IDs: `T-LAYER-FEATURE-###` (e.g. `T-UI-PAY-001`, `T-API-ORD-005`, `T-DB-INT-003`).
- Test names must be descriptive: `T-UI-AUTH-001: User login with valid email and password succeeds`.

## Git workflow
- Branch per task: `feature/T-UI-AUTH-001-login`.
- Commit messages reference Test IDs: `T-API-ORD-005: add stock check assertion`.
- Open a PR (template provided), get at least one peer approval, link the JIRA ticket.

## Code standards
- Cypress: Page Objects for selectors, Arrange-Act-Assert, no hard-coded sleeps, JSON fixtures for data.
- Postman: assert status code, schema and data; use environment variables; folders by resource.
- SQL: comment purpose, document expected row counts, no PII.
- Run `npm run quality` before pushing (ESLint, Prettier, TypeScript).
