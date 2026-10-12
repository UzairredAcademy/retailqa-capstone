// P1 | Return and refund processing
// Expected: A valid return is refunded to the original method, stock is restored, the audit trail is complete, and an out-of-window return is refused

describe('T-E2E-RET-001: Return and refund processing', () => {
  it.skip('Return and refund processing', () => {
    // Step 1 [UI] Log in and open a delivered order inside the 30-day window
    //   expect: Order details displayed (FR-001-AC1, FR-005-AC1)
    // Step 2 [UI] Initiate a return for selected items with a reason
    //   expect: Return created with status Requested (FR-005-AC1)
    // Step 3 [API] GET the return
    //   expect: Status Requested; within-window check passed (FR-005-AC1, FR-007-AC1)
    // Step 4 [UI] Compare the refund amount shown with the API refund amount
    //   expect: Both equal the independently calculated refund (FR-005-AC2, FR-007-AC1)
    // Step 5 [API] Mark the return as received (warehouse role)
    //   expect: Return status Received (FR-005-AC4)
    // Step 6 [SQL] Query InventoryLedger and Inventory for the returned SKUs
    //   expect: Positive ledger entry equals the returned quantity; stock restored (FR-005-AC4, FR-007-AC2)
    // Step 7 [API] Issue/confirm the refund and GET it
    //   expect: Refund references the original payment and method (FR-005-AC3, FR-003-AC5)
    // Step 8 [SQL] Query Refunds and Payments
    //   expect: Refund linked to the original payment; amount <= amount paid; totals consistent (FR-005-AC3, FR-007-AC4)
    // Step 9 [SQL] Query AuditLog for the return
    //   expect: Requested, Received and Refunded events exist, in order, with actor and timestamp (FR-005-AC5)
    // Step 10 [UI] Open the return and the dashboard order history
    //   expect: Status Refunded; refund amount and original method displayed (FR-005-AC2, FR-005-AC3)
    // Step 11 [UI] Try to return an order older than 30 days (UI and API)
    //   expect: Refused with a policy message; no return or refund rows are created (FR-005-AC1)
  });
});
