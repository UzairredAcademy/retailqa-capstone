// FR-002 Order Management - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC4
  it.skip('T-UI-ORD-007: Delivery address can be changed before payment [BLOCKED - the order page has no edit control]', () => {
    // Arrange: an unpaid order; Act: change the delivery address and save;
    // Assert: new address shown on the order and persists after refresh.
    // The only address field is on the New Order form (before the order exists). See T-UI-ORD-006.
  });
});
