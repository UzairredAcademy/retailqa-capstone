# Team Collaboration Log

## Roles
| Member | Role / ownership |
|---|---|
| Uzair Salaam | Cypress UI (page objects, 20 UI tests), the five end-to-end specs, Postman scripts, defect logging and Jira results, RTM workbook, README and presentation |
| Yaaseen Karriem | Postman API (21 API tests), Cypress UI (20 UI tests), SQL validation queries (8 of 20), results recorded on Jira test-case tickets |
| Both | SQL / JIRA: SQL validation (Uzair 12, Yaaseen 8), Jira defects and blockers on the LCP2 board, review of results |

Execution counts come from the "Executed By" column of the test case workbook: UI 20 / 20, API 19 (Uzair) / 21 (Yaaseen), SQL 12 (Uzair) / 8 (Yaaseen), E2E 5 (Uzair).

## Log
| Date | Activity | Evidence (PR / JIRA) |
|---|---|---|
| Oct 2026 | Read the brief and resource pack; planned the 100 test cases, 5 E2E scenarios and RTM; set up the GitHub repository and feature-branch workflow | RetailQE_Test_Cases_and_RTM.xlsx; repo structure |
| 27 Oct 2026 | First Cypress UI tests run (authentication) against the live system | LCP2-25 (story), LCP2-26, LCP2-50, LCP2-51 |
| 27 - 29 Oct 2026 | UI order tests run; defects logged: coupon discount, double-click order, stock not restored on cancel | LCP2-154, LCP2-161, LCP2-162 |
| 28 Oct - 2 Nov 2026 | UI payment, delivery, dashboard, returns and cross-browser tests run; defects logged | LCP2-156 to LCP2-160, LCP2-163 to LCP2-169 |
| 29 Oct - 3 Nov 2026 | Postman scripts written and run for authentication and orders; lockout and logout defects logged | LCP2-170, LCP2-171 |
| 2 - 11 Nov 2026 | Postman payments, shipments, delivery and returns run; blockers raised for features the system does not have | LCP2-172, LCP2-178, LCP2-179 to LCP2-181 |
| 6 - 20 Nov 2026 | Remaining Postman tests, global error handling and idempotency; defects logged | LCP2-182 to LCP2-189, LCP2-193, LCP2-194 |
| 19 - 22 Nov 2026 | SQL validation queries run and results recorded; audit-trail and notification defects logged | LCP2-190 to LCP2-192, LCP2-195 to LCP2-197 |
| 20 - 22 Nov 2026 | Five end-to-end Cypress specs run; reconciliation evidence saved to `reports/e2e/` | T-E2E-ORD-001 to T-E2E-INV-001 on the LCP2 board |
| 22 Nov 2026 | Jira rechecked for the 8 outstanding SQL results; workbook, README and presentation updated (61 pass, 38 fail, 6 blocked) | LCP2-133 to LCP2-140 |

## Working agreements
- Each test has its own Jira ticket; actual results and evidence go on that ticket.
- Defects are Bugs; features the system does not have are logged as Tasks (blockers) so they are not counted as test failures.
- The database is reset to seed data (`RESET_SYSTEM.bat`) before stock-sensitive runs.
- One Cypress config file in the project root; one spec per file.
