// FR-002 Order Management - P0
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';

const create = new CreateOrderPage();
const DOCK = 'USB-C Dock'; // SKU-1004, R1250.00, stock 5

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC1
  it('T-UI-ORD-002: Quantity validation rejects zero, negative, non-numeric and above-stock quantities', () => {
    // Arrange
    create.visit();
    create.stockOf(DOCK).then((stock) => {
      expect(stock, `${DOCK} stock (run RESET_SYSTEM.bat if it is 0)`).to.be.greaterThan(0);

      const rejected = (label) => {
        create.error().should('be.visible');
        create.success().should('not.exist');
        cy.log(`${label} rejected`);
      };

      // Zero: nothing to order -> rejected
      create.setQuantity(DOCK, 0);
      create.submit();
      rejected('quantity 0');

      // Negative: the number field does not allow typing a minus sign, so change the request in flight
      cy.reload();
      cy.intercept('POST', '**/orders', (req) => {
        const firstItem = req.body && Array.isArray(req.body.items) ? req.body.items[0] : null;
        if (firstItem) {
          req.body.items = [{ ...firstItem, quantity: -1 }];
        }
      }).as('negativeOrder');
      create.setQuantity(DOCK, 1);
      create.submit();
      cy.wait('@negativeOrder').its('response.statusCode').should('be.within', 400, 499);
      rejected('quantity -1');

      // Non-numeric: the number field does not accept letters, so nothing is ordered
      create.visit();
      create.quantityInput(DOCK).invoke('val', 'abc');
      create.quantityInput(DOCK).should('have.value', '');
      create.submit();
      rejected('quantity abc');

      // Above stock (stock + 1) -> rejected and stock unchanged
      create.visit();
      create.setQuantity(DOCK, stock + 1);
      create.submit();
      rejected(`quantity ${stock + 1} (stock + 1)`);
      create.visit();
      create.stockOf(DOCK).should('eq', stock);

      // Exactly the available stock -> accepted
      create.setQuantity(DOCK, stock);
      create.submit();
      create.success().should('contain', 'Order #');
      create.createdOrderId(); // tracked, cancelled afterwards to put the stock back
    });

    // Inactive product (SKU-1006 Legacy Keyboard) is not offered for ordering
    create.visit();
    cy.contains('.product', 'Legacy Keyboard').should('not.exist');
    // Note: the list shows only active products (SKU-1006 is inactive with 0 stock in the seed data).
  });
});
