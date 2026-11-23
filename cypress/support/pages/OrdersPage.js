import { money } from '../utils';

/** Page object for the order history / filters (/orders). */
const sel = {
  status: '[data-testid="status-filter"]',
  min: 'input[placeholder="Min price"]',
  max: 'input[placeholder="Max price"]',
  row: '[data-testid^="order-"]',
};

/** Turn the rows currently in <main> into [{id, status, total}]. */
export const parseRows = ($main) =>
  $main
    .find(sel.row)
    .toArray()
    .map((el) => {
      const spans = Cypress.$(el).find('span');
      return {
        id: Number(el.getAttribute('data-testid').replace('order-', '')),
        status: spans.eq(0).text().trim(),
        total: money(spans.eq(1).text()),
      };
    });

export class OrdersPage {
  visit() {
    cy.intercept('GET', '**/orders?*').as('getOrders');
    cy.visit('/orders');
    cy.wait('@getOrders');
    cy.contains('h1', 'Orders').should('be.visible');
    return this;
  }

  /** Retries until the rows on screen satisfy the callback (rows are rendered after the API call). */
  expectRows(assertion) {
    return cy.get('main').should(($main) => assertion(parseRows($main)));
  }

  filterStatus(label) {
    cy.get(sel.status).select(label);
    return this;
  }

  setMin(value) {
    cy.get(sel.min).clear();
    if (value !== '') cy.get(sel.min).type(String(value));
    return this;
  }

  setMax(value) {
    cy.get(sel.max).clear();
    if (value !== '') cy.get(sel.max).type(String(value));
    return this;
  }

  apply() {
    cy.intercept('GET', '**/orders?*').as('getOrders');
    cy.contains('button', 'Apply filters').click();
    cy.wait('@getOrders');
    return this;
  }
}
