# retailqa-capstone

Quality Engineering capstone for **Lewis Retail Group** (RetailQE, Retail Delivery Module), built by **Uzair Salaam** and **Yaaseen Karriem** on the redAcademy Quality Engineering programme.

The project tests one retail application at four levels and checks that all of them agree with each other:

| Layer | Tool | What it checks |
|---|---|---|
| UI | Cypress | Customer journeys in the browser (login, orders, payments, delivery tracking, dashboard, returns, cross-browser) |
| API | Postman | REST endpoints, status codes, error schema, business rules |
| Database | SQL Server (T-SQL) | Data integrity, inventory reconciliation, audit trail |
| End to end | Cypress + SQL | Five scenarios that follow one order across UI, API and database |

Requirements are FR-001 to FR-007 (37 acceptance criteria). Every test is traced to its acceptance criteria in `RetailQE_Test_Cases_and_RTM.xlsx` (test case list, requirements traceability matrix and coverage summary). Defects and test results are tracked in Jira, project **LCP2**.

## Contents

- [System under test](#system-under-test)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the tests](#running-the-tests)
- [Project structure](#project-structure)
- [Test coverage](#test-coverage)
- [End-to-end scenarios](#end-to-end-scenarios)
- [Test data and cleanup](#test-data-and-cleanup)
- [Reports and evidence](#reports-and-evidence)
- [Latest results](#latest-results)
- [Known limitations of the system under test](#known-limitations-of-the-system-under-test)
- [Troubleshooting](#troubleshooting)
- [Team](#team)

## System under test

The RetailQE training application runs locally from the course resource pack:

| Component | Address |
|---|---|
| UI (web app) | http://localhost:5173 |
| REST API | http://localhost:4000/api |
| Database | SQL Server, database `RetailQEDb`, `localhost:1433` |

Seed data used by the tests:

- Customer login: `customer1@retailqe.test` / `Pass123!`
- Products: SKU-1001 Wireless Mouse (20), SKU-1002 Office Chair (10), SKU-1003 Desk Lamp (8), SKU-1004 USB-C Dock (5), SKU-1005 Laptop Stand (12), SKU-1006 Legacy Keyboard (0, inactive)
- Tax: 15% of the subtotal. Coupon `SAVE10` gives a 10% discount.
- Sandbox cards are kept in `cypress/fixtures/cards.json` (approved, declined, expired and invalid-CVV cards).

## Prerequisites

- Node.js (current LTS) and npm
- Google Chrome, Microsoft Edge and Firefox (for the cross-browser tests)
- The RetailQE system running (UI, API and SQL Server), started from the resource pack
- Postman (desktop app) or Newman (`npm install -g newman`) for the API tests
- SQL Server Management Studio, Azure Data Studio or `sqlcmd` for the SQL validation scripts

## Setup

```bash
git clone <this repository>
cd retailqa-capstone
npm install
```

If npm blocks the Cypress install script, approve it and install the binary:

```bash
npm install-scripts approve cypress
npx cypress install
npx cypress verify
```

Make sure the system is reset to its seed data before a full run (use the resource pack's reset script, for example `RESET_SYSTEM.bat`). Several tests change stock, so a run on already-used data can fail for the wrong reason.

### Configuration

`cypress.config.js` (project root) sets the base URL, the API URL and the SQL task:

- `baseUrl`: `http://localhost:5173`
- `env.apiUrl`: `http://localhost:4000/api`
- `cy.task('sql', { query, params })` runs a T-SQL query against `RetailQEDb` through the `mssql` package.
- The SQL password defaults to the training value and can be overridden with the `SQL_PASSWORD` environment variable. Do not commit real credentials.

There must be only one Cypress config file in the project. A second `cypress.config.js` inside the `cypress` folder causes an "Obsolete option `testFiles`" error.

## Running the tests

### Cypress (UI and end-to-end)

```bash
# interactive runner
npx cypress open

# all specs, headless
npx cypress run

# one spec
npx cypress run --spec "cypress/e2e/e2e/return-refund.cy.js"

# another browser
npx cypress run --browser edge
npx cypress run --browser firefox
```

### Postman (API)

Import the collections and the environment from `postman/` into Postman and select the environment, or run them from the command line:

```bash
newman run postman/collections/<collection>.json -e postman/environments/<environment>.json
```

Log in first (Authentication collection) so that the token is stored in the environment.

### SQL validation

Open the scripts in `sql/validation/` in your SQL client, connected to `RetailQEDb`. Each script is one test: a query that should return **0 rows** when the data is healthy. Any returned row is a violation and the test fails.

## Project structure

```
retailqa-capstone/
├── cypress.config.js            Cypress settings and the sql task
├── cypress/
│   ├── e2e/
│   │   ├── UI_auth/ ...         Layer UI specs (one folder or file per feature)
│   │   └── e2e/                 The five end-to-end scenarios
│   │       ├── order-lifecycle.cy.js        T-E2E-ORD-001
│   │       ├── payment-failure.cy.js        T-E2E-PAY-001
│   │       ├── address-change.cy.js         T-E2E-ADR-001
│   │       ├── return-refund.cy.js          T-E2E-RET-001
│   │       └── inventory-consistency.cy.js  T-E2E-INV-001
│   ├── fixtures/                users.json, cards.json, coupons
│   └── support/
│       ├── e2e.js               Global hooks (cleans up unpaid test orders)
│       ├── commands.js          loginAs, apiProducts, apiCreateOrder, apiPay, apiSetShipmentStatus, ...
│       ├── utils.js             apiUrl, credentials, money and rounding helpers, tax and coupon rates
│       └── pages/               Page objects: LoginPage, CreateOrderPage, OrderDetailPage, OrdersPage, ProfilePage
├── postman/
│   ├── collections/             Orders, Payments, Shipments, Delivery, Returns, Authentication, Global errors
│   └── environments/
├── sql/validation/              One script per T-DB test
├── reports/                     Generated evidence (see Reports and evidence)
└── RetailQE_Test_Cases_and_RTM.xlsx
```

File and folder names may differ slightly in your checkout; the test case workbook lists the exact location of every test in its "Tool / Location" column.

## Test coverage

Test IDs follow the pattern `T-LAYER-FEATURE-###`.

| Layer | Planned | Features |
|---|---|---|
| Cypress (UI) | 40 | Authentication, order management, payment, delivery tracking, dashboard, returns and refunds, cross-browser |
| Postman (API) | 40 | Authentication, orders, payments, shipments, delivery, returns, global error handling |
| SQL (DB) | 20 | Order, payment, shipment, inventory and audit integrity |
| End to end | 5 | See below |

The workbook `RetailQE_Test_Cases_and_RTM.xlsx` has these sheets: **Test Cases**, **E2E Steps**, **RTM** (requirement to test to defect) and **Coverage Summary** (counts, pass rates and exit criteria).

## End-to-end scenarios

Each scenario is one Cypress spec with numbered steps, tagged `[UI]`, `[API]` or `[SQL]`, each mapped to acceptance criteria. Steps that the application cannot support are written as `it.skip` with a `BLOCKED:` reason. Extra checks added during execution carry a "b" suffix (for example Step 03b).

| ID | Scenario | Spec |
|---|---|---|
| T-E2E-ORD-001 | Complete order lifecycle, login to delivery | `order-lifecycle.cy.js` |
| T-E2E-PAY-001 | Payment failure and retry | `payment-failure.cy.js` |
| T-E2E-ADR-001 | Address change before delivery | `address-change.cy.js` |
| T-E2E-RET-001 | Return and refund processing | `return-refund.cy.js` |
| T-E2E-INV-001 | Inventory consistency end to end | `inventory-consistency.cy.js` |

Specs share a `state` object between steps, so run each spec as a whole file rather than a single `it`.

## Test data and cleanup

- A global `afterEach` in `cypress/support/e2e.js` cancels unpaid orders created by a test. The E2E specs switch this off (`Cypress.env('keepData', true)`) so that later steps can use the order, and switch it back on afterwards.
- Because cancelling an order does not currently restore stock (see below) and orders are not deleted, stock goes down as tests run. Reset the database to the seed data before re-running the inventory, return and stock-sensitive specs.
- Tests create their own orders through the API where possible, so they do not depend on each other.

## Reports and evidence

- Cypress screenshots and videos are written to `cypress/screenshots` and `cypress/videos` on failed headless runs.
- If `cypress-mochawesome-reporter` is installed, an HTML report is generated automatically.
- The cross-layer reconciliation specs write JSON evidence to `reports/e2e/`, for example `T-E2E-ORD-001-reconciliation.json` and `T-E2E-INV-001-reconciliation.json`.
- Screenshots and results for each test are attached to its Jira ticket in the LCP2 project.

## Latest results

Results as recorded in the test case workbook on 22 November 2026:

| Layer | Pass | Fail | Blocked | Not run |
|---|---|---|---|---|
| Cypress (UI) | 26 | 14 | 0 | 0 |
| Postman (API) | 21 | 13 | 6 | 0 |
| SQL (DB) | 6 | 6 | 0 | 8 |
| End to end | 1 | 4 | 0 | 0 |

The exit criteria in the brief (UI pass rate 90%, API, SQL and E2E pass rate 100%) are **not met**; the failures are real defects in the application, logged in Jira. The eight SQL payment and shipment integrity tests are still to be run.

Notable defects found:

- Cancelling an order does not restore stock or write a ledger entry (LCP2-161, LCP2-175)
- A paid order can be paid again and is charged twice (LCP2-169, LCP2-193)
- Double-clicking Create Order submits the order twice (LCP2-162, LCP2-187)
- Declined payments show "Request failed (402)" and store no decline reason (LCP2-195, LCP2-196)
- Audit log records no actor, an incomplete return trail, duplicate notifications and no address-change entry (LCP2-190, LCP2-191, LCP2-192, LCP2-197)
- A return is accepted after the 30-day window (LCP2-188)
- No account lockout after five failed logins, and the session token stays valid after logout (LCP2-170, LCP2-171)
- A customer can read another customer's order, and protected endpoints accept requests with no token (LCP2-185, LCP2-182)

## Known limitations of the system under test

These are gaps in the application that stop some steps from running. They are recorded as BLOCKED steps, not as test failures:

- Proof of delivery is not integrated (T-API-DEL-003, LCP2-178)
- There is no notification table or endpoint; notifications appear only as "queued" rows in `AuditLog`
- There is no refund, return or payments read endpoint, and no "mark return as received" step or warehouse role
- Returns cover the whole order; partial returns are not supported (LCP2-194)
- The UI has no control to change an order's address and does not display the delivery address, a refund amount or the payment method
- Shipments have no destination address field
- The payment status is `Approved`; the requirements call it `Settled`

## Troubleshooting

| Problem | Fix |
|---|---|
| `Obsolete option testFiles` | Remove the extra `cypress/cypress.config.js`; keep one config file in the project root |
| `Cypress failed to install` after `npm install` | `npm install-scripts approve cypress`, then `npx cypress install` |
| `cy.then() failed because you are mixing up async and sync code` | In `cy.then(() => ...)`, wrap the body in braces so the callback does not return a page object: `cy.then(() => { page.method(); })` |
| `Identifier ... has already been declared` | A spec was pasted into an existing file; keep one spec per file |
| `S0 ... expected N to be at least 5` | Stock has been used up by earlier runs; reset the database |
| SQL task returns `undefined` for an UPDATE | The task must return `result.recordset \|\| []` |
| Connection refused on `localhost:4000` or `5173` | Start the RetailQE system from the resource pack |

## Team

- Muhammad Uzair Salaam
- Mogamat Yaaseen Karriem

Built for the redAcademy Quality Engineering capstone, Lewis Retail Group (RetailQE). Out of scope per the brief: performance testing, penetration testing, mobile apps and building the retail system itself.
