// P0 | Payment failure and retry
// Expected: A declined payment leaves no partial state; the retry succeeds once with exactly one charge

describe('T-E2E-PAY-001: Payment failure and retry', () => {
  it.skip('Payment failure and retry', () => {
    // Step 1 [UI] Log in, add a product and proceed to payment
    //   expect: Payment page displayed (FR-001-AC1, FR-002-AC1)
    // Step 2 [UI] Pay with the declined sandbox card
    //   expect: Graceful decline message; user can retry (FR-003-AC3)
    // Step 3 [API] GET the payment and order
    //   expect: Payment Declined with reason code; order still awaiting payment (FR-003-AC3, FR-007-AC1)
    // Step 4 [SQL] Query Payments, Orders and Shipments for the order
    //   expect: Declined row stored with reason; order not Paid; no shipment (no partial state) (FR-007-AC3, FR-004-AC1)
    // Step 5 [UI] Retry with an invalid CVV
    //   expect: Validation rejects it before any charge (FR-003-AC1)
    // Step 6 [UI] Retry with a valid card
    //   expect: Payment succeeds; order Paid (FR-003-AC2)
    // Step 7 [API] GET payments for the order
    //   expect: Exactly one successful payment (plus the earlier declined attempt) (FR-003-AC4)
    // Step 8 [SQL] Query Payments for the order
    //   expect: One Settled payment; declined attempt retained for audit; charged total = order total (FR-003-AC4, FR-007-AC4)
    // Step 9 [UI] Re-submit/double-click the payment confirmation
    //   expect: No second charge is made (FR-003-AC4)
    // Step 10 [SQL] Re-run the payment and order integrity checks
    //   expect: Still one successful payment; no orphan or partial records (FR-007-AC3)
    // Step 11 [API] GET the shipment for the order
    //   expect: Exactly one shipment created after payment was confirmed (FR-004-AC1)
  });
});
