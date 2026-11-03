// FR-002 Order Management - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC4
  it.skip('T-UI-ORD-006: Order quantity can be modified before payment and totals recalculate [BLOCKED - the order page has no edit control]', () => {
    // Arrange: an unpaid order for SKU-1001 x2 (cy.apiCreateOrder)
    // Act: open the order, change a line quantity from 2 to 4, save
    // Assert: line total, tax and total recalculate and persist after a refresh
    // The order details page only offers Pay / Cancel for an unpaid order, so there is nothing to click.
    // The API contract has PUT /orders/{orderId} - covered by T-API-ORD-007. Raise with the facilitator
    // whether the UI is meant to offer this; if it does, implement the steps above with its selectors.
  });
});
