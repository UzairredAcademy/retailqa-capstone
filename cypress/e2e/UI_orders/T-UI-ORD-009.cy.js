// FR-002 Order Management - P0
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const create = new CreateOrderPage();
const order = new OrderDetailPage();
const STAND = 'Laptop Stand'; // SKU-1005, R680.00, stock 12

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC6
  it('T-UI-ORD-009: Cancelling an order updates its status and returns inventory', () => {
    // Arrange
    create.visit();
    create.stockOf(STAND).then((before) => {
      create.placeOrder({ items: [{ name: STAND, qty: 2 }] }).then((id) => {
        // Creating the order reserves the stock
        create.visit();
        create.stockOf(STAND).then((reserved) => {
          expect(reserved, 'stock after ordering 2').to.eq(before - 2);
        });

        // Act
        order.visit(id);
        order.cancel();

        // Assert
        order.success().should('contain', 'cancelled');
        order.status().should('eq', 'Cancelled');
        create.visit();
        create.stockOf(STAND).then((after) => {
          expect(after, 'stock restored after cancelling').to.eq(before);
        });
      });
    });
  });
});
