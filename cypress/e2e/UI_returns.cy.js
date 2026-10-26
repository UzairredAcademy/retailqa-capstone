// FR-005 Returns & Refunds Processing - P1
import { OrderDetailPage } from '../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Returns & Refunds', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-005-AC1
  it('T-UI-RET-001: Return can be initiated within the 30-day window', () => {
    // Arrange: a shipped (not yet delivered) order has no return option
    cy.apiCreateShippedOrder({ sku: 'SKU-1001', quantity: 1 }).then((shippedId) => {
      order.visit(shippedId);
      order.tracking().its('status').should('eq', 'Shipped');
      cy.contains('button', 'Request Return').should('not.exist');
    });

    // Arrange: a delivered order (delivered just now, so inside the 30-day window)
    cy.apiCreateDeliveredOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);
      order.requestReturn();

      // Assert
      order.success().should('be.visible').and('contain', 'Return #');
      order.error().should('not.exist');
    });
  });

  // FR-005-AC1
  it('T-UI-RET-002: Return is blocked after the 30-day window', function () {
    // Needs an order delivered more than 30 days ago. Dates must not be edited, so ask the facilitator for
    // such an order and put its id in cypress.env.json as "agedOrderId".
    const agedOrderId = Cypress.expose('agedOrderId');
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

  // FR-005-AC2
  it.skip('T-UI-RET-003: Refund amount is displayed correctly [BLOCKED - the UI shows no refund amount]', () => {
    // Arrange: delivered order (with and without SAVE10); Act: request the return
    // Assert: refund amount shown equals the expected refund and Returns.RefundAmount.
    // After a return the page only says "Return #<id> created" - no refund amount is displayed, and the
    // pack does not define the refund formula (items only vs including tax). The amount can be checked
    // in the database (T-DB-PAY-004 / T-DB-INV-004) and via the API once the facilitator confirms the rule.
  });

  // FR-005-AC3
  it.skip('T-UI-RET-004: Return status shows refund to the original payment method [BLOCKED - the UI shows no refund details]', () => {
    // Arrange: complete a return; Act: open the return/order details
    // Assert: status Refunded and the original payment method (masked card) and amount are shown.
    // The UI has no return status or refund view, and Payments has no payment-method column.
  });
});
