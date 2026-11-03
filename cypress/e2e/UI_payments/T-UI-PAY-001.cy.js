// FR-003 Payment Processing - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import cards from '../../fixtures/cards.json';

const order = new OrderDetailPage();

describe('Payment Processing', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
    // Arrange: an unpaid order for one Laptop Stand (SKU-1005)
    cy.apiCreateOrder({ sku: 'SKU-1005', quantity: 1 }).its('OrderId').as('orderId');
  });

  // FR-003-AC2
  it('T-UI-PAY-001: Payment with a valid card succeeds', () => {
    cy.get('@orderId').then((id) => {
      // Act
      order.visit(id);
      order.pay(cards.approved.number);

      // Assert
      order
        .success()
        .should('be.visible')
        .invoke('text')
        .should('match', /payment\s+approved/i);
      order.status().should('eq', 'Paid');
      order.paymentLine().should('contain', 'Approved');
      cy.contains('button', 'Pay').should('not.exist');
    });
  });
});
