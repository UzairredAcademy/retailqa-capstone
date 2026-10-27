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

  // FR-003-AC4
  it('T-UI-PAY-006: Double-clicking Pay does not charge twice', () => {
    cy.intercept('POST', '**/payments').as('payments');
    cy.get('@orderId').then((id) => {
      // Arrange
      order.visit(id);
      order.cardInput().clear();
      order.cardInput().type(cards.approved.number);

      // Act
      order.payButton().dblclick();

      // Assert: wait for every payment request to finish, then count the successful charges
      cy.get('@payments.all').should((calls) => {
        expect(calls.length, 'payment requests').to.be.gte(1);
        expect(
          calls.every((c) => c.state === 'Complete'),
          'all requests complete',
        ).to.eq(true);
      });
      cy.get('@payments.all').then((calls) => {
        const charged = calls.filter((c) => c.response && c.response.statusCode === 201);
        expect(charged.length, 'successful charges for one order').to.eq(1);
      });
      order.status().should('eq', 'Paid');
    });
  });
});
