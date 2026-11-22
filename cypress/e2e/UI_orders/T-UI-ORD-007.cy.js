// FR-002 Order Management - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

const OLD_ADDRESS = '14 Main Road, Cape Town';
const NEW_ADDRESS = '22 Long Street, Cape Town';
const EDIT_CONTROL = /edit|change|modify|update/i;

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC4
  it('T-UI-ORD-007: Delivery address can be changed before payment', () => {
    // Arrange: an unpaid order with a known delivery address (cancelled automatically after the test)
    cy.apiCreateOrder({ sku: 'SKU-1001', quantity: 1, address: OLD_ADDRESS })
      .its('OrderId')
      .then((id) => {
        order.visit(id);
        order.status().should('eq', 'Created');

        // Act: open the editor, change the delivery address and save
        // If this fails here, the UI has no way to edit an order (requirement gap - see the notes).
        cy.contains('button, a', EDIT_CONTROL, { timeout: 4000 }).should('be.visible').click();
        cy.contains('label', /address/i)
          .find('input')
          .clear();
        cy.contains('label', /address/i)
          .find('input')
          .type(NEW_ADDRESS);
        cy.contains('button', /save|update|apply/i).click();

        // Assert: the new address is shown on the order and persists after a refresh
        cy.contains(NEW_ADDRESS).should('be.visible');
        cy.contains(OLD_ADDRESS).should('not.exist');
        cy.reload();
        cy.contains(NEW_ADDRESS).should('be.visible');
        order.status().should('eq', 'Created');

        // Assert: the API holds the new address too
        cy.apiGetOrder(id).its('Address').should('eq', NEW_ADDRESS);
      });
  });
});