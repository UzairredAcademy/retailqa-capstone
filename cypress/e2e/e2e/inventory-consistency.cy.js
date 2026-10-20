// P1 | Inventory consistency end to end
// Expected: Stock moves correctly for sale, cancellation and return; ledger reconciles and UI = API = DB

describe('T-E2E-INV-001: Inventory consistency end to end', () => {
  it.skip('Inventory consistency end to end', () => {
    // Step 1 [SQL] Record the baseline stock S0 for a chosen SKU
    //   expect: S0 captured (FR-007-AC2)
    // Step 2 [UI] Log in, order quantity 3 of the SKU and pay
    //   expect: Order Paid; displayed availability = S0 - 3 (FR-002-AC1, FR-003-AC2)
    // Step 3 [API] GET the product stock
    //   expect: Stock = S0 - 3 (matches UI) (FR-007-AC1)
    // Step 4 [SQL] Query Inventory and InventoryLedger
    //   expect: Stock = S0 - 3; ledger has a Sale entry of -3 (FR-007-AC2)
    // Step 5 [UI] Place a second order for quantity 2, then cancel it before shipment
    //   expect: Second order Cancelled (FR-002-AC6)
    // Step 6 [API] GET the product stock after cancellation
    //   expect: Stock is back to S0 - 3 (FR-002-AC6, FR-007-AC1)
    // Step 7 [SQL] Query InventoryLedger for the cancelled order
    //   expect: Compensating +2 entry exists; stock = S0 - 3 (FR-002-AC6, FR-007-AC2)
    // Step 8 [API] Attempt an order for more than the available stock
    //   expect: Rejected; stock unchanged and no partial reservation (FR-002-AC1, FR-007-AC3)
    // Step 9 [API] Return quantity 1 from the first order and mark it received
    //   expect: Return Received (FR-005-AC4)
    // Step 10 [SQL] Query Inventory and InventoryLedger after the return
    //   expect: Stock = S0 - 2; ledger has a Return entry of +1 (FR-005-AC4, FR-007-AC2)
    // Step 11 [UI] Check the displayed availability for the SKU
    //   expect: Displayed availability = S0 - 2 (FR-007-AC1)
    // Step 12 [SQL] Run the reconciliation query (opening + SUM(ledger) = current) and check for negative stock
    //   expect: No differences; no negative stock; UI = API = DB (FR-007-AC3, FR-007-AC4)
  });
});
