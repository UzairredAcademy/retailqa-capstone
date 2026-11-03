// FR-002 Order Management - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC5
  it('T-UI-ORD-008: Order cannot be modified after payment', () => {
    // Arrange
    cy.apiCreatePaidOrder({ sku: 'SKU-1005', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);

      // Assert: paid, and nothing on the page lets the customer change or pay again
      order.status().should('eq', 'Paid');
      cy.get('main input').should('not.exist');
      cy.contains('button', 'Pay').should('not.exist');
      cy.contains('button', 'Cancel').should('not.exist');
      cy.contains('button, a', /edit|change|modify|update/i).should('not.exist');
    });
  });
});
