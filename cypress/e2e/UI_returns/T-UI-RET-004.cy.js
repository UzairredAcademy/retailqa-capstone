// FR-005 Returns & Refunds Processing - P1

describe('Returns & Refunds', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-005-AC3
  it.skip('T-UI-RET-004: Return status shows refund to the original payment method [BLOCKED - the UI shows no refund details]', () => {
    // Arrange: complete a return; Act: open the return/order details
    // Assert: status Refunded and the original payment method (masked card) and amount are shown.
    // The UI has no return status or refund view, and Payments has no payment-method column.
  });
});
