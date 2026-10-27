// FR-004 Shipment & Delivery Tracking - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Delivery Tracking', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-004-AC1
  it('T-UI-DEL-004: Unpaid order shows no shipment or tracking number', () => {
    // Arrange
    cy.apiCreateOrder({ sku: 'SKU-1005', quantity: 1 })
      .its('OrderId')
      .then((id) => {
        // Act
        order.visit(id);

        // Assert
        order.status().should('eq', 'Created');
        cy.contains('p', 'Tracking:').should('not.exist');
        cy.contains('button', 'Mark Shipped').should('not.exist');
        cy.apiGetOrder(id).should((body) => {
          expect(body.shipment, 'no shipment before payment').to.not.exist;
        });
      });
  });
});
