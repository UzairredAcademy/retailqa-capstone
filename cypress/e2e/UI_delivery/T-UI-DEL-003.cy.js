// FR-004 Shipment & Delivery Tracking - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Delivery Tracking', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-004-AC3
  it('T-UI-DEL-003: Delivered status is displayed after the shipment is delivered', () => {
    // Arrange: paid order, shipment moved to Shipped then Delivered through the API
    cy.apiCreateDeliveredOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);

      // Assert
      order.tracking().its('status').should('eq', 'Delivered');
      cy.apiGetOrder(id).its('shipment.DeliveredAt').should('not.be.null');
    });
  });
});
