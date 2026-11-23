# Cypress UI suite (JavaScript)

The 40 UI tests from `docs/REQUIREMENTS-TRACEABILITY.xlsx` (layer *Cypress (UI)*), written against the RetailQE web app. Test IDs and titles are unchanged so they map straight into the RTM.

## Set up
1. `npm install`
2. Copy `cypress.env.example.json` to **`cypress.env.json`** (git-ignored) and fill in the three passwords from the runtime pack's `access/TEST_CREDENTIALS.md`.
3. Start the system (`docker compose up --build` in the runtime pack). Defaults: web `http://localhost:5173`, API `http://localhost:4000/api` (Swagger at `/api-docs/`). Override with `CYPRESS_BASE_URL` and `apiUrl` in `cypress.env.json`.

## Run
```bash
npm run cy:open          # interactive
npm run test:ui          # everything, headless (reports in reports/cypress)
npx cypress run --spec cypress/e2e/orders.cy.js
npm run test:xbr:chrome  # cross-browser spec on one browser; also test:xbr:firefox / test:xbr:edge
```

## Before each full run: reset the data
Paid orders cannot be undone and they use up product stock (Wireless Mouse 20, Laptop Stand 12). Unpaid orders the tests create are cancelled automatically afterwards. Run the pack's `RESET_SYSTEM.bat` (or `database/03_reset_training_data.sql`) before a full run, or a later run can fail with "insufficient stock". Set `keepData: true` in `cypress.env.json` to keep the orders for inspection.

## How the tests are built
- **Locators** are the app's own `data-testid` attributes (`email`, `password`, `login-button`, `nav-*`, `coupon`, `create-order`, `card-number`, `pay-button`, `status-filter`, ...) plus visible text where the app has no test id. They live in `cypress/support/pages/` (page objects), never in the specs.
- **Arrange through the API, act and assert in the UI.** `cypress/support/commands.js` has `cy.loginAs()` (UI login cached with `cy.session`) and `cy.apiCreateOrder / apiCreatePaidOrder / apiCreateShippedOrder / apiCreateDeliveredOrder` for quick setup.
- **Expected values come from the BRD and the pack's business rules** (tax 15%, SAVE10 = 10%, 30-day window), not from how the system currently behaves, so a wrong total or stock level shows up as a failing test.
- Passwords are never in the repo: they come from `cypress.env.json`.

## Test status
| Test ID | AC | Spec | Status | Notes |
|---|---|---|---|---|
| T-UI-AUTH-001 | FR-001-AC1 | auth.cy.js | Ready |  |
| T-UI-AUTH-002 | FR-001-AC2 | auth.cy.js | Ready |  |
| T-UI-AUTH-003 | FR-001-AC3 | auth.cy.js | Ready |  |
| T-UI-AUTH-004 | FR-001-AC4 | auth.cy.js | Ready | Fakes only the clock (`cy.clock`) to jump 29 then 31 minutes. The app expires the session 30 min after login (not after inactivity). |
| T-UI-ORD-001 | FR-002-AC1 | orders.cy.js | Ready |  |
| T-UI-ORD-002 | FR-002-AC1 | orders.cy.js | Ready | Negative quantity cannot be typed (number field), so the request is altered in flight. Inactive SKU-1006 is not listed in the UI. |
| T-UI-ORD-003 | FR-002-AC2 | orders.cy.js | Ready |  |
| T-UI-ORD-004 | FR-002-AC3 | orders.cy.js | Ready |  |
| T-UI-ORD-005 | FR-002-AC3 | orders.cy.js | Ready | Passes if the code is rejected, or accepted with no discount. Expired/used coupons are not in the pack. |
| T-UI-ORD-006 | FR-002-AC4 | orders.cy.js | Blocked | BLOCKED: order page has no edit control (API covers it: T-API-ORD-007). |
| T-UI-ORD-007 | FR-002-AC4 | orders.cy.js | Blocked | BLOCKED: order page has no edit control. |
| T-UI-ORD-008 | FR-002-AC5 | orders.cy.js | Ready |  |
| T-UI-ORD-009 | FR-002-AC6 | orders.cy.js | Ready |  |
| T-UI-ORD-010 | FR-002-AC7 | orders.cy.js | Ready |  |
| T-UI-PAY-001 | FR-003-AC2 | payments.cy.js | Ready |  |
| T-UI-PAY-002 | FR-003-AC1 | payments.cy.js | Ready |  |
| T-UI-PAY-003 | FR-003-AC1 | payments.cy.js | Ready | UI sends a fixed expiry (12/30), so the request is altered in flight (01/20, then the current month). |
| T-UI-PAY-004 | FR-003-AC1 | payments.cy.js | Ready | UI sends a fixed CVV (123), so the request is altered in flight. |
| T-UI-PAY-005 | FR-003-AC3 | payments.cy.js | Ready |  |
| T-UI-PAY-006 | FR-003-AC4 | payments.cy.js | Ready |  |
| T-UI-DEL-001 | FR-004-AC2 | delivery.cy.js | Ready |  |
| T-UI-DEL-002 | FR-004-AC3 | delivery.cy.js | Ready |  |
| T-UI-DEL-003 | FR-004-AC3 | delivery.cy.js | Ready |  |
| T-UI-DEL-004 | FR-004-AC1 | delivery.cy.js | Ready |  |
| T-UI-DEL-005 | FR-004-AC2 | delivery.cy.js | Ready | No tracking-by-number page exists: checks tracking on the order page and the unknown-order message. |
| T-UI-DEL-006 | FR-004-AC5 | delivery.cy.js | Blocked | BLOCKED: UI shows no proof of delivery / delivered date. |
| T-UI-DASH-001 | FR-006-AC1 | dashboard.cy.js | Blocked | BLOCKED: no pagination in the Orders page or API. |
| T-UI-DASH-002 | FR-006-AC2 | dashboard.cy.js | Ready | Status and price filters. No date-range inputs in the UI. |
| T-UI-DASH-003 | FR-006-AC3 | dashboard.cy.js | Ready | Edits and validates the single address (no multi-address UI). Restores customer 2 afterwards. |
| T-UI-DASH-004 | FR-006-AC4 | dashboard.cy.js | Ready | Restores customer 2 afterwards. The page does not handle a rejected save, so expect this to expose a defect. |
| T-UI-RET-001 | FR-005-AC1 | returns.cy.js | Ready |  |
| T-UI-RET-002 | FR-005-AC1 | returns.cy.js | Needs data | Needs `agedOrderId` in cypress.env.json (order delivered > 30 days ago, from the facilitator); skipped without it. |
| T-UI-RET-003 | FR-005-AC2 | returns.cy.js | Blocked | BLOCKED: UI shows no refund amount. |
| T-UI-RET-004 | FR-005-AC3 | returns.cy.js | Blocked | BLOCKED: UI shows no return status / refund method. |
| T-UI-XBR-001 | FR-001-AC1; FR-001-AC3 | cross-browser.cy.js | Per browser | Runs only in Chrome/Chromium. |
| T-UI-XBR-002 | FR-001-AC1; FR-001-AC3 | cross-browser.cy.js | Per browser | Runs only in Firefox. |
| T-UI-XBR-003 | FR-001-AC1; FR-001-AC3 | cross-browser.cy.js | Per browser | Runs only in Edge. |
| T-UI-XBR-004 | FR-002-AC2 | cross-browser.cy.js | Per browser | Runs only in Firefox. |
| T-UI-XBR-005 | FR-002-AC2 | cross-browser.cy.js | Per browser | Runs only in Edge. |
| T-UI-XBR-006 | FR-004-AC2; FR-004-AC3 | cross-browser.cy.js | Ready |  |

**6 tests are skipped as BLOCKED** because the supplied UI has no way to perform the step (no edit controls on an order, no pagination, no proof of delivery, no refund details). Each one keeps its Arrange/Act/Assert plan in comments. Do not log these as application defects: raise them with the facilitator (BRD 11.3), mark them *Blocked* in the RTM, and implement them if the facilitator says the feature is in scope. Some are covered at API/SQL level.

## Not verified yet
These specs were written from the app's front-end markup and have **not been executed** (the author had no access to your running system). Expect to fix a few selectors or timings on the first run. When a test fails, check whether the app or the test is wrong before logging a defect.
