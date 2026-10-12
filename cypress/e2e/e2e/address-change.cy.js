// P1 | Address change before delivery
// Expected: Address can be changed before payment only; the final address is consistent across UI, API, DB and the shipment

describe('T-E2E-ADR-001: Address change before delivery', () => {
  it.skip('Address change before delivery', () => {
    // Step 1 [UI] Log in and add a new saved address (Address B)
    //   expect: Address B appears in saved addresses (FR-001-AC1, FR-006-AC3)
    // Step 2 [API] GET saved addresses
    //   expect: Address B is returned and equals the UI values (FR-007-AC1)
    // Step 3 [UI] Create an order delivering to Address A
    //   expect: Order summary shows Address A (FR-002-AC1)
    // Step 4 [UI] Change the order's delivery address to B before paying
    //   expect: Order summary shows Address B (FR-002-AC4)
    // Step 5 [API] GET the order
    //   expect: Delivery address is B (FR-007-AC1)
    // Step 6 [UI] Pay with a valid card
    //   expect: Order Paid (FR-003-AC2)
    // Step 7 [SQL] Query the order's address and payment
    //   expect: Order address = B; payment Settled (FR-007-AC2)
    // Step 8 [UI] Try to change the address after payment
    //   expect: Change is blocked with a message (FR-002-AC5)
    // Step 9 [API] PUT a new address on the paid order
    //   expect: Rejected (409/403/422); address remains B (FR-002-AC5)
    // Step 10 [API] GET the shipment
    //   expect: Shipment created with destination Address B and a tracking number (FR-004-AC1, FR-004-AC2)
    // Step 11 [SQL] Query Shipments and AuditLog
    //   expect: Shipment destination = B; the pre-payment address change is audited (FR-007-AC2)
    // Step 12 [UI] Open the tracking page
    //   expect: Delivery address and status shown match the API and DB (FR-004-AC3, FR-007-AC1)
  });
});
