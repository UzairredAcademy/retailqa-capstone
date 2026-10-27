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

  /**
   * The UI only has a card-number field - expiry (12/30) and CVV (123) are sent with fixed values.
   * To test expiry/CVV validation through the real UI flow, the payment request is changed in flight.
   * Returns a function that sets the fields to override on the next payment request.
   */
  const overridePaymentFields = () => {
    let override = {};
    cy.intercept('POST', '**/payments', (req) => {
      req.body = { ...req.body, ...override };
    }).as('payment');
    return (fields) => {
      override = fields;
    };
  };

  // FR-003-AC1
  it('T-UI-PAY-003: Expired card is rejected', () => {
    const setOverride = overridePaymentFields();
    cy.get('@orderId').then((id) => {
      // Act: expiry in the past (01/20)
      cy.then(() => setOverride({ expiry: cards.expired.expiry }));
      order.visit(id);
      order.pay(cards.approved.number);

      // Assert
      cy.wait('@payment').its('response.statusCode').should('be.within', 400, 499);
      order.error().should('be.visible');
      order.status().should('eq', 'Created');

      // Boundary: the current month/year is accepted
      const now = new Date();
      const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(
        now.getFullYear(),
      ).slice(-2)}`;
      cy.then(() => setOverride({ expiry: currentMonth }));
      order.visit(id);
      order.pay(cards.approved.number);
      cy.wait('@payment').its('response.statusCode').should('eq', 201);
      order.status().should('eq', 'Paid');
    });
  });
});
