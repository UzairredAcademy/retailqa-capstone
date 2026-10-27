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

  // FR-003-AC1
  it('T-UI-PAY-002: Invalid card number format is rejected', () => {
    // The pack lists 1234 as the invalid-format card. A 16-digit number that fails the Luhn check is not
    // included: the pack does not say the system checks Luhn, so it is left out to avoid a false defect.
    const invalidNumbers = [cards.invalidFormat.number, 'abcdefghijklmnop', ''];
    cy.get('@orderId').then((id) => {
      invalidNumbers.forEach((number) => {
        // Act
        order.visit(id);
        order.pay(number);

        // Assert
        order.error().should('be.visible');
        order.success().should('not.exist');
        order.status().should('eq', 'Created');
        order.paymentLine().should('not.exist');
      });
    });
  });
});
