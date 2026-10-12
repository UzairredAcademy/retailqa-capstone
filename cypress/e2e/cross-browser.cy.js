// Cross-Browser Support - P2
// Preconditions: Same seeded data as the main suite; run with --browser chrome / firefox / edge

describe('Cross-Browser Support', () => {
  // FR-001-AC1, FR-001-AC3 | Positive
  it.skip('T-UI-XBR-001: Login and session persistence work on Chrome', () => {
    // Arrange
    // Act
    //   1. Run the login + navigation flow with --browser chrome
    // Assert
    //   Login succeeds and session persists across navigation; no console errors
  });

  // FR-001-AC1, FR-001-AC3 | Positive
  it.skip('T-UI-XBR-002: Login and session persistence work on Firefox', () => {
    // Arrange
    // Act
    //   1. Run the login + navigation flow with --browser firefox
    // Assert
    //   Same results as Chrome; no layout break or console errors
  });

  // FR-001-AC1, FR-001-AC3 | Positive
  it.skip('T-UI-XBR-003: Login and session persistence work on Edge', () => {
    // Arrange
    // Act
    //   1. Run the login + navigation flow with --browser edge
    // Assert
    //   Same results as Chrome; no layout break or console errors
  });

  // FR-002-AC2 | Positive
  it.skip('T-UI-XBR-004: Order total calculation is correct on Firefox', () => {
    // Arrange
    // Act
    //   1. Run the order total flow with --browser firefox
    // Assert
    //   Displayed subtotal, tax and total equal the expected values
  });

  // FR-002-AC2 | Positive
  it.skip('T-UI-XBR-005: Order total calculation is correct on Edge', () => {
    // Arrange
    // Act
    //   1. Run the order total flow with --browser edge
    // Assert
    //   Displayed subtotal, tax and total equal the expected values
  });

  // FR-004-AC2, FR-004-AC3 | Positive
  it.skip('T-UI-XBR-006: Tracking page renders correctly at 1920x1080 and 1366x768', () => {
    // Arrange
    // Act
    //   1. Set the viewport to 1920x1080 and open a shipped order
    //   2. Repeat at 1366x768
    // Assert
    //   Tracking number and status timeline are visible, readable and not truncated at both resolutions
  });
});
