// FR-002 Order Management - P0
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { round2 } from '../../support/utils';

const create = new CreateOrderPage();
const order = new OrderDetailPage();
const MOUSE = 'Wireless Mouse'; // SKU-1001, R450.00

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC1
  it('T-UI-ORD-001: Add a product to the order with a valid quantity', () => {
    // Arrange
    create.visit();
    create.priceOf(MOUSE).then((price) => {
      // Act
      create.placeOrder({ items: [{ name: MOUSE, qty: 2 }] }).then((id) => {
        // Assert
        order.visit(id);
        order.itemLine(MOUSE, 2).should('contain', `R ${round2(price * 2).toFixed(2)}`);
      });
    });
  });
});
