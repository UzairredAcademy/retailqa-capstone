// FR-002 Order Management - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { round2, TAX_RATE } from '../../support/utils';

const order = new OrderDetailPage();

const MOUSE = 'Wireless Mouse'; // SKU-1001
const EDIT_CONTROL = /edit|change|modify|update/i;

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC4
  it('T-UI-ORD-006: Order quantity can be modified before payment and totals recalculate', () => {
    // Arrange: an unpaid order for Wireless Mouse x2 (cancelled automatically after the test)
    cy.apiCreateOrder({ sku: 'SKU-1001', quantity: 2 })
      .its('OrderId')
      .then((id) => {
        order.visit(id);
        order.status().should('eq', 'Created');
        order.itemLine(MOUSE, 2).should('be.visible');

        order.totals().then((before) => {
          const unitPrice = before.subtotal / 2;
          const newSubtotal = round2(unitPrice * 4);
          const newTax = round2(newSubtotal * TAX_RATE);

          // Act: open the editor and change the quantity from 2 to 4
          // If this fails here, the UI has no way to edit an order (requirement gap - see the notes).
          cy.contains('button, a', EDIT_CONTROL, { timeout: 4000 }).should('be.visible').click();
          cy.contains('li, tr, p, div', MOUSE).find('input').first().type('{selectall}4');
          cy.contains('button', /save|update|apply/i).click();

          // Assert: line total, tax and total recalculate
          order.itemLine(MOUSE, 4).should('contain', `R ${newSubtotal.toFixed(2)}`);
          order.totals().then((t) => {
            expect(t.subtotal, 'subtotal').to.be.closeTo(newSubtotal, 0.01);
            expect(t.tax, 'tax = 15% of the subtotal').to.be.closeTo(newTax, 0.01);
            expect(t.total, 'total = subtotal + tax').to.be.closeTo(
              round2(newSubtotal + newTax),
              0.01,
            );
          });

          // Assert: the change persists after a refresh and in the API
          cy.reload();
          order.itemLine(MOUSE, 4).should('be.visible');
          order.status().should('eq', 'Created');
          cy.apiGetOrder(id).then((body) => {
            expect(body.items[0].Quantity, 'saved quantity').to.eq(4);
            expect(Number(body.Subtotal), 'saved subtotal').to.be.closeTo(newSubtotal, 0.01);
          });
        });
      });
  });
});