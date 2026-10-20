import './commands';
import { apiUrl, drainTrackedOrders } from './utils';

// Clean-up: cancel the unpaid orders a test created so product stock is restored for the next test.
// (Paid orders cannot be cancelled - the facilitator's RESET_SYSTEM script restores the seed data.)
// Set CYPRESS_keepData=true to leave everything in place for inspection.
afterEach(() => {
  if (Cypress.env('keepData')) return;
  drainTrackedOrders().forEach((id) => {
    cy.request({ url: apiUrl(`/orders/${id}`), failOnStatusCode: false }).then((res) => {
      if (res.status === 200 && res.body && res.body.Status === 'Created') {
        cy.request({
          method: 'POST',
          url: apiUrl(`/orders/${id}/cancel`),
          failOnStatusCode: false,
        });
      }
    });
  });
});
