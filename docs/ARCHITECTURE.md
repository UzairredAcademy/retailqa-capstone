# Architecture

Layers: UI (Cypress, POM) -> API (Postman/Newman) -> Data (SQL). GitHub Actions orchestrates runs and reporting; results are linked to JIRA.

## System under test

```
 Browser (React/Vite UI, :5173)
        |  REST + JWT
        v
 Node/Express API (:4000, Swagger at /api-docs)
        |  T-SQL
        v
 SQL Server (RetailQEDb, :1433)
```

The system is the Lewis RetailQE training application, run locally from the runtime pack (Docker compose; `RUN_SYSTEM.bat` starts it, `RESET_SYSTEM.bat` restores the seed data).

## Test framework

```
 GitHub Actions (ci.yml)
   |-- quality  : ESLint + Prettier
   |-- api      : Newman  ---------------------> REST API
   `-- ui       : Cypress (Chrome / Edge / Firefox) --> UI --> API

 SQL validation scripts are run by hand in SSMS / Azure Data Studio
 against RetailQEDb (not a CI job).

 Cypress E2E specs also call the API directly (cy.request)
 and the database (cy.task('sql') using mssql).

 Results --> reports/  --> Jira LCP2 (test case tickets + defects)
```

## Layers

| Layer | Tool | Location | Role |
|---|---|---|---|
| UI | Cypress 14, JavaScript, page object model | `cypress/e2e/`, `cypress/support/pages/` | Customer journeys: login, orders, payment, tracking, dashboard, returns, cross-browser. Page objects: LoginPage, CreateOrderPage, OrderDetailPage, OrdersPage, ProfilePage. |
| API | Postman, Newman 6 | `postman/collections/`, `postman/environments/` | Endpoint behaviour, status codes, error schema, business rules. Before-request and after-response scripts per test. |
| Data | SQL Server, T-SQL | `sql/validation/`, `sql/setup/` | Integrity checks. Each script returns 0 rows when data is healthy. Run in SSMS or Azure Data Studio. |
| End to end | Cypress with `cy.request` and `cy.task('sql')` | `cypress/e2e/e2e/` | Five scenarios that follow one order through UI, API and SQL and reconcile all three. |
| Support code | Cypress commands and utils | `cypress/support/` | `loginAs`, `apiCreateOrder`, `apiPay`, `apiSetShipmentStatus`; tax, coupon and rounding helpers; global clean-up of unpaid test orders. |
| CI | GitHub Actions | `.github/workflows/ci.yml` | Quality gate first, then the API (Newman) and UI (Cypress) jobs, with reports uploaded as artifacts. SQL scripts are run manually. |
| Tracking | Jira LCP2 | n/a | One ticket per test case with actual results and evidence; defects linked to the tests that found them. |

## Cross-layer idea

The same fact is read from three places and compared. For example, an order total is read from the UI, from `GET /orders/{id}` and from the `Orders` table, and the three must match (FR-007). Stock is checked the same way against `Inventory` and `InventoryLedger`.

## Configuration

- One `cypress.config.js` in the project root. It sets `baseUrl`, `env.apiUrl` and the `sql` task. A second config file causes an "Obsolete option testFiles" error.
- The SQL password is read from `SQL_PASSWORD`; no real credentials are committed.
- Git workflow: feature branches, pull request template, CI must pass before merge.

## Diagram file

An image version of the diagrams above can be saved as `docs/architecture.png`. The text diagrams here are the source of truth.
