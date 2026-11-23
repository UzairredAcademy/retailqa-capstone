// FR-004 Shipment & Delivery Tracking - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Delivery Tracking', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-004-AC1, FR-004-AC3
  it('T-UI-DEL-002: Shipped status is displayed correctly', () => {
    cy.apiCreatePaidOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Arrange + Assert: freshly paid -> Preparing
      order.visit(id);
      order.tracking().its('status').should('eq', 'Preparing');

      // Act: move the shipment to Shipped
      order.markShipped();

      // Assert
      order.success().should('contain', 'Shipment updated');
      order.tracking().its('status').should('eq', 'Shipped');
      cy.apiGetOrder(id).its('shipment.Status').should('eq', 'Shipped');
      // The UI shows no timestamp or status timeline (planned expectation) - only the status text.
    });
  });
});
