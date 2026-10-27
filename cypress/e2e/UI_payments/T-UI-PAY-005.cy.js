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

  // FR-003-AC3
  it('T-UI-PAY-005: Declined card is handled gracefully', () => {
    cy.get('@orderId').then((id) => {
      // Act
      order.visit(id);
      order.pay(cards.declined.number);

      // Assert: friendly message (no technical detail), order still unpaid, payment can be retried
      order
        .error()
        .should('be.visible')
        .invoke('text')
        .then((text) => {
          expect(text.trim(), 'decline message').to.not.be.empty;
          expect(text, 'no technical error details').to.not.match(
            /stack|exception|undefined|\[object|sql|econn|internal server|<html/i,
          );
        });
      order.status().should('eq', 'Created');
      order.payButton().should('be.visible').and('be.enabled');
    });
  });
});
