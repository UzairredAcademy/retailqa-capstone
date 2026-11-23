import { money, trackOrder } from '../utils';

/** Page object for "New Order" (/create-order). */
const sel = {
  product: '.product',
  coupon: '[data-testid="coupon"]',
  submit: '[data-testid="create-order"]',
  success: '.success',
  error: '.error',
};

export class CreateOrderPage {
  visit() {
    cy.intercept('GET', '**/products').as('getProducts');
    cy.visit('/create-order');
    cy.wait('@getProducts');
    cy.get(sel.product).should('have.length.greaterThan', 0);
    return this;
  }

  card(name) {
    return cy.contains(sel.product, name);
  }

  /** Unit price shown on the product card (number). */
  priceOf(name) {
    return this.card(name)
      .invoke('text')
      .then((text) => money(text));
  }

  /** Stock shown on the product card (number). */
  stockOf(name) {
    return this.card(name)
      .invoke('text')
      .then((text) => {
        const m = /Stock:\s*(\d+)/.exec(text);
        expect(m, `stock shown for ${name}`).to.not.equal(null);
        return Number(m[1]);
      });
  }

  quantityInput(name) {
    return this.card(name).find('input');
  }

  setQuantity(name, quantity) {
    this.quantityInput(name).type(`{selectall}${quantity}`);
    return this;
  }

  setCoupon(code) {
    cy.get(sel.coupon).clear();
    if (code) cy.get(sel.coupon).type(code);
    return this;
  }

  setAddress(address) {
    cy.contains('label', 'Delivery address').find('input').clear();
    cy.contains('label', 'Delivery address').find('input').type(address);
    return this;
  }

  submit() {
    cy.get(sel.submit).click();
    return this;
  }

  success() {
    return cy.get(sel.success);
  }

  error() {
    return cy.get(sel.error);
  }

  /** Reads "Order #123 created. Total R 1403.00" and yields the new order id (and tracks it for clean-up). */
  createdOrderId() {
    return this.success()
      .invoke('text')
      .then((text) => {
        const m = /Order #(\d+)/.exec(text);
        expect(m, `order id in "${text}"`).to.not.equal(null);
        const id = Number(m[1]);
        trackOrder(id);
        return id;
      });
  }

  /**
   * Fill the form and create an order through the UI.
   * @param {{items: {name: string, qty: number}[], coupon?: string, address?: string}} order
   */
  placeOrder({ items, coupon, address }) {
    items.forEach(({ name, qty }) => this.setQuantity(name, qty));
    if (coupon !== undefined) this.setCoupon(coupon);
    if (address) this.setAddress(address);
    this.submit();
    return this.createdOrderId();
  }
}
