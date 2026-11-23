import { parseTotals } from '../utils';

/** Page object for the order details page (/orders/:id). */
const sel = {
  card: '[data-testid="card-number"]',
  pay: '[data-testid="pay-button"]',
  success: '.success',
  error: '.error',
};

export class OrderDetailPage {
  visit(orderId) {
    cy.visit(`/orders/${orderId}`);
    cy.contains('h1', `Order #${orderId}`).should('be.visible');
    return this;
  }

  /** Wait until the order itself has loaded (an unknown order shows an error instead). */
  loaded() {
    return cy.contains('p', 'Status:').should('be.visible');
  }

  status() {
    this.loaded();
    return cy.contains('p', 'Status:').find('b').invoke('text');
  }

  totals() {
    this.loaded();
    return cy
      .contains('p', 'Subtotal')
      .invoke('text')
      .then((text) => parseTotals(text));
  }

  /** The line for an ordered item, e.g. itemLine('Wireless Mouse', 2) -> "Wireless Mouse x 2 = R 900.00". */
  itemLine(name, quantity) {
    return cy.contains('p', `${name} × ${quantity}`);
  }

  paymentLine() {
    return cy.contains('p', 'Payment:');
  }

  /** The "Tracking: <number> / <status>" line. */
  trackingLine() {
    return cy.contains('p', 'Tracking:');
  }

  tracking() {
    return this.trackingLine()
      .invoke('text')
      .then((text) => {
        const m = /Tracking:\s*(\S+)\s*\/\s*(\S+)/.exec(text);
        expect(m, `tracking line "${text}"`).to.not.equal(null);
        return { number: m[1], status: m[2] };
      });
  }

  cardInput() {
    return cy.get(sel.card);
  }

  payButton() {
    return cy.get(sel.pay);
  }

  /** Enter a card number and click Pay. (The UI has no expiry/CVV fields - it sends fixed values.) */
  pay(cardNumber) {
    this.cardInput().clear();
    if (cardNumber) this.cardInput().type(cardNumber);
    this.payButton().click();
    return this;
  }

  cancel() {
    cy.contains('button', 'Cancel').click();
    return this;
  }

  markShipped() {
    cy.contains('button', 'Mark Shipped').click();
    return this;
  }

  markDelivered() {
    cy.contains('button', 'Mark Delivered').click();
    return this;
  }

  requestReturn() {
    cy.contains('button', 'Request Return').click();
    return this;
  }

  success() {
    return cy.get(sel.success);
  }

  error() {
    return cy.get(sel.error);
  }
}
