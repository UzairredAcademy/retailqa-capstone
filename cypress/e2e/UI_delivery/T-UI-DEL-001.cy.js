// FR-004 Shipment & Delivery Tracking - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Delivery Tracking', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-004-AC2
  it('T-UI-DEL-001: Tracking number is assigned and visible on the order details page', () => {
    // Arrange: a paid order
    cy.apiCreatePaidOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);

      // Assert: a tracking number is shown and equals the one held by the API
      order.tracking().then(({ number, status }) => {
        expect(number, 'tracking number').to.match(/\S+/);
        expect(status, 'new shipment status').to.eq('Preparing');
        cy.apiGetOrder(id).its('shipment.TrackingNumber').should('eq', number);
      });
    });
  });
});
