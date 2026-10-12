// Returns & Refunds - P1
// Preconditions: Customer has a delivered order inside the 30-day window and one outside it

describe('Returns & Refunds', () => {
  // FR-005-AC1 | Positive
  it.skip('T-UI-RET-001: Return can be initiated within the 30-day window', () => {
    // Arrange
    // Act
    //   1. Open a delivered order inside 30 days
    //   2. Click Return
    //   3. Select item(s) and reason
    //   4. Submit
    // Assert
    //   Return request is created with status Requested and a return reference is displayed
  });

  // FR-005-AC1 | Negative / Boundary
  it.skip('T-UI-RET-002: Return is blocked after the 30-day window', () => {
    // Arrange
    // Act
    //   1. Open a delivered order older than 30 days
    //   2. Look for the Return option
    //   3. Try the direct return URL
    // Assert
    //   Return is not offered or is rejected with a message citing the 30-day policy; no return is created
  });

  // FR-005-AC2 | Positive
  it.skip('T-UI-RET-003: Refund amount is displayed correctly', () => {
    // Arrange
    // Act
    //   1. Start a return for part of an order that had a coupon
    //   2. Review the refund summary
    // Assert
    //   Refund = returned items' price (after proportional discount) + applicable tax; matches the independently calculated amount
  });

  // FR-005-AC3 | Positive
  it.skip('T-UI-RET-004: Return status shows refund to the original payment method', () => {
    // Arrange
    // Act
    //   1. Complete a return through to refund
    //   2. Open the return details
    // Assert
    //   Return status shows Refunded; refund method shows the original payment method (masked card) and amount
  });
});
