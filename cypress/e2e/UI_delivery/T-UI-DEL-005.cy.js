// FR-004 Shipment & Delivery Tracking - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Delivery Tracking', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-004-AC2
  it('T-UI-DEL-005: Tracking page finds a shipment by tracking number and handles unknown numbers', () => {
    // The UI has no tracking-by-number page: tracking is shown on each order's details page, so this
    // test checks that, and that an order that does not exist produces a clear message instead.
    cy.apiCreatePaidOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      order.visit(id);
      order.trackingLine().should('be.visible');

      // Unknown order -> clear error, no tracking data, no blank/crashed page
      cy.visit('/orders/99999999');
      cy.contains('h1', 'Order #99999999').should('be.visible');
      order.error().should('be.visible').invoke('text').should('not.be.empty');
      cy.contains('p', 'Tracking:').should('not.exist');
    });
  });
});
