# Test Strategy (2-3 pages)

## 1. Test approach
Risk-based, shift-left. _TODO: describe how risk drives test priority (P0/P1/P2)._

## 2. Test scope
Core retail workflows: Authentication, Orders, Payments, Delivery, Returns, Dashboard. Out of scope: performance, security penetration, mobile, building the system, DevOps.

## 3. Risk analysis
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| _TODO_ | | | |

## 4. Entry / exit criteria
- Entry: _TODO_
- Exit: 40 Cypress (>=90% pass), 40 Postman (100%), 20 SQL (0 violations), 5 E2E (100%), 100% FR coverage in RTM, 0 ESLint errors.

## 5. Regression strategy
Automated smoke suite run in CI on every push. _TODO: list the smoke tests._

## 6. Tools and environments
Cypress, TypeScript, Postman/Newman, SQL, JIRA, GitHub Actions.
