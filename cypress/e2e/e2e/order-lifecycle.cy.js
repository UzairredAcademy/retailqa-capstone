// P0 | Complete order lifecycle (login to delivery)
// Expected: Order is created, paid, shipped and delivered; UI, API and DB values agree at every checkpoint

describe('T-E2E-ORD-001: Complete order lifecycle (login to delivery)', () => {
  it.skip('Complete order lifecycle (login to delivery)', () => {
    // Step 1 [UI] Log in with a valid customer account
    //   expect: Dashboard is displayed (FR-001-AC1)
    // Step 2 [UI] Add two products with valid quantities and apply a valid coupon
    //   expect: Cart shows items, discount and total (FR-002-AC1, FR-002-AC3)
    // Step 3 [UI] Capture the displayed subtotal, discount, tax and total
    //   expect: Values stored for comparison (FR-002-AC2)
    // Step 4 [API] GET the order/cart via API and compare with the captured UI values
    //   expect: UI values equal API values (FR-007-AC1)
    // Step 5 [UI] Pay with a valid sandbox card
    //   expect: Payment confirmation is displayed (FR-003-AC2)
    // Step 6 [API] GET the payment by order id
    //   expect: Status Settled/Authorized; amount equals order total (FR-003-AC2, FR-007-AC1)
    // Step 7 [SQL] Query Orders and Payments for the order
    //   expect: Order = Paid; exactly one successful payment; Orders.total = Payments.amount = UI total (FR-007-AC2, FR-007-AC4)
    // Step 8 [API] GET the shipment for the order
    //   expect: Shipment created after payment; tracking number assigned (FR-004-AC1, FR-004-AC2)
    // Step 9 [SQL] Query Shipments and Inventory
    //   expect: Shipment row exists with a unique tracking number; stock reduced by the ordered quantities (FR-004-AC1, FR-007-AC2)
    // Step 10 [API] Update the shipment to Shipped, then Delivered with proof of delivery
    //   expect: Statuses update in order; POD stored (FR-004-AC3, FR-004-AC5)
    // Step 11 [SQL] Query NotificationLog and ProofOfDelivery
    //   expect: SMS/email logged for Shipped and Delivered; POD record exists (FR-004-AC4, FR-004-AC5)
    // Step 12 [UI] Open the order details page
    //   expect: Status Delivered, tracking number and POD displayed and equal to API values (FR-004-AC3, FR-007-AC1)
    // Step 13 [SQL] Run the cross-layer reconciliation query (UI = API = DB totals)
    //   expect: No differences; reconciliation report saved as evidence (FR-007-AC4)
  });
});
