# Test Strategy (2-3 pages)

Project: RetailQE retail delivery module, Lewis Retail Group. Team: Uzair Salaam, Yaaseen Karriem (redAcademy Quality Engineering capstone).

## 1. Test approach
Risk-based, shift-left. Requirements FR-001 to FR-007 (37 acceptance criteria) were turned into test cases before the system was available, and every test is traced to its acceptance criteria in `docs/REQUIREMENTS-TRACEABILITY.xlsx`.

Risk decides priority:
- **P0** - failure loses money, orders or customer data, or blocks the purchase path: authentication, order creation and totals, payment, shipment creation and tracking, stock and audit integrity. Run first and on every push.
- **P1** - important but the purchase still completes: dashboard and account management, returns and refunds.
- **P2** - supporting quality: cross-browser behaviour. Run before release.

Testing is layered so each risk is checked at the cheapest level that can see it, then reconciled across levels:
- **UI (Cypress, 40 tests):** customer journeys and what the customer sees.
- **API (Postman/Newman, 40 tests):** business rules, status codes, error format, security checks.
- **Database (SQL, 20 scripts):** data integrity, inventory reconciliation, audit trail.
- **End to end (5 scenarios):** one order followed through UI, API and SQL, with all three compared (FR-007).

Each test has a type (positive or negative), a priority and a traceable ID (`T-LAYER-FEATURE-###`). Defects are logged in Jira (LCP2) with steps, expected and actual result, evidence and the failing test. Features the system does not have are logged as blockers, not as failures.

## 2. Test scope
Core retail workflows: Authentication, Orders, Payments, Delivery, Returns, Dashboard. Out of scope: performance, security penetration, mobile, building the system, DevOps.

Basic security checks that the requirements ask for (account lockout, token invalidation, unauthenticated access) are in scope as functional tests, not as penetration testing.

## 3. Risk analysis
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Customer charged twice (double-click, repeated payment request) | High | High | P0 UI, API and SQL tests on payment uniqueness (T-UI-PAY-006, T-API-PAY-006, T-DB-PAY-001); E2E payment retry scenario |
| Stock not restored on cancellation or return, so products show out of stock or oversell | High | High | Inventory ledger reconciliation in SQL (T-DB-INV-001 to 004); E2E inventory scenario; reset data before stock runs |
| Totals, tax or coupon discount wrong | Medium | High | UI and API calculation tests; order total check in SQL; UI = API = DB reconciliation |
| Unauthorised access to accounts or orders (no token check, no lockout, token valid after logout) | Medium | High | API authentication and error-handling tests (T-API-AUTH, T-API-ERR) |
| Duplicate orders from double submission | High | Medium | UI double-submit test, API idempotency test, SQL duplicate check |
| Shipment or delivery data incomplete (no delivered date, no proof of delivery, invalid status changes) | Medium | Medium | Shipment and delivery API tests; SQL shipment integrity |
| Returns accepted outside the 30-day window or without refund and audit evidence | Medium | Medium | Return tests at UI, API and SQL level; E2E return scenario |
| Audit trail missing actor, events or notifications (compliance) | Medium | Medium | SQL audit and compliance scripts |
| Features required by the BRD are not built, so tests cannot run | High | Medium | Raise as blockers early, mark steps BLOCKED with a reason, agree fixes with the business |
| Test data drifts (stock used up, leftover orders) and tests fail for the wrong reason | High | Medium | Tests create their own data; global clean-up of unpaid orders; reset script before full runs |
| Environment unavailable or differs between machines | Medium | Medium | Runtime pack run locally from Docker; documented setup and troubleshooting in the README |

## 4. Entry / exit criteria
- Entry: the system runs locally (UI :5173, API :4000, SQL Server :1433) and was reset to seed data; the BRD and resource pack are available; test cases and RTM are agreed; test accounts and sandbox cards are available; Jira board and Git repository are set up.
- Exit: 40 Cypress (>=90% pass), 40 Postman (100%), 20 SQL (0 violations), 5 E2E (100%), 100% FR coverage in RTM, 0 ESLint errors.
- Defect rule: every failure has a Jira defect with evidence; blocked tests have a blocker ticket naming the missing feature.
- Result against these criteria is reported in `TEST-EXECUTION-SUMMARY.md`.

## 5. Regression strategy
Automated smoke suite run in CI on every push (GitHub Actions: quality gate, then Newman and Cypress). The full suite runs before each release and after each defect fix, starting with the tests linked to that defect in the RTM.

Smoke tests (P0, fast, no stock dependency):
- T-UI-AUTH-001 - login succeeds
- T-UI-AUTH-002 - invalid login rejected
- T-UI-ORD-001 - add a product to an order
- T-UI-ORD-003 - order total equals items x price + tax
- T-UI-PAY-001 - payment with a valid card
- T-UI-DEL-001 - tracking number visible after payment
- T-API-AUTH-001 - login returns 200 and a JWT
- T-API-ORD-001 - create an order
- T-API-PAY-001 - payment authorised
- T-API-SHP-001 - shipment created after payment
- T-DB-ORD-002 - order totals correct
- T-DB-INV-001 - stock never negative
- T-E2E-ORD-001 - complete order lifecycle

Stock-sensitive tests (inventory, returns, cancellation) run only on freshly reset data.

## 6. Tools and environments
- Cypress 14 with JavaScript and the page object model (UI and E2E); Chrome, Edge and Firefox.
- Postman and Newman 6 (API), with before-request and after-response scripts.
- SQL Server with T-SQL scripts in SSMS or Azure Data Studio (database); `mssql` through `cy.task('sql')` for E2E.
- ESLint and Prettier for code quality.
- Jira (LCP2) for test cases, results and defects; Git and GitHub for source control with feature branches and pull requests; GitHub Actions for CI.
- Environment: local RetailQE runtime pack (web UI, REST API with Swagger at /api-docs, SQL Server `RetailQEDb`), reset with `RESET_SYSTEM.bat`. Synthetic data only; no real customer or card data.
