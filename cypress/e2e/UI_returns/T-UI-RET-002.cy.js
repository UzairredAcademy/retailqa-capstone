// FR-005 Returns & Refunds Processing - P1
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Returns & Refunds', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-005-AC1
  it('T-UI-RET-002: Return is blocked after the 30-day window', function () {
    // Needs an order delivered more than 30 days ago. Dates must not be edited, so ask the facilitator for
    // such an order and put its id in cypress.env.json as "agedOrderId".
    const agedOrderId = Cypress.env('agedOrderId');
    if (!/^\d+$/.test(String(agedOrderId))) {
      // BLOCKED: no aged order supplied (set agedOrderId in cypress.env.json)
      this.skip();
    }

    // Act
    order.visit(agedOrderId);
    order.tracking().its('status').should('eq', 'Delivered');

    // Assert: the return is either not offered, or refused with a message - never created
    cy.get('main').then(($main) => {
      if ($main.find('button:contains("Request Return")').length === 0) {
        cy.log('Return option is not offered for an order older than 30 days');
        return;
      }
      order.requestReturn();
      order.error().should('be.visible');
      order.success().should('not.exist');
    });
  });
});
