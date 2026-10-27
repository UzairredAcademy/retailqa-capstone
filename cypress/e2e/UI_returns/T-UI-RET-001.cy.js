// FR-005 Returns & Refunds Processing - P1
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Returns & Refunds', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-005-AC1
  it('T-UI-RET-001: Return can be initiated within the 30-day window', () => {
    // Arrange: a shipped (not yet delivered) order has no return option
    cy.apiCreateShippedOrder({ sku: 'SKU-1001', quantity: 1 }).then((shippedId) => {
      order.visit(shippedId);
      order.tracking().its('status').should('eq', 'Shipped');
      cy.contains('button', 'Request Return').should('not.exist');
    });

    // Arrange: a delivered order (delivered just now, so inside the 30-day window)
    cy.apiCreateDeliveredOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);
      order.requestReturn();

      // Assert
      order.success().should('be.visible').and('contain', 'Return #');
      order.error().should('not.exist');
    });
  });
});
