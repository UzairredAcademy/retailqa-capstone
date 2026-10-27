// FR-005 Returns & Refunds Processing - P1

describe('Returns & Refunds', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-005-AC2
  it.skip('T-UI-RET-003: Refund amount is displayed correctly [BLOCKED - the UI shows no refund amount]', () => {
    // Arrange: delivered order (with and without SAVE10); Act: request the return
    // Assert: refund amount shown equals the expected refund and Returns.RefundAmount.
    // After a return the page only says "Return #<id> created" - no refund amount is displayed, and the
    // pack does not define the refund formula (items only vs including tax). The amount can be checked
    // in the database (T-DB-PAY-004 / T-DB-INV-004) and via the API once the facilitator confirms the rule.
  });
});
