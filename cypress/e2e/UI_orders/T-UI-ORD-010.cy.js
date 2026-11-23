// FR-002 Order Management - P0
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { trackOrder } from '../../support/utils';

const create = new CreateOrderPage();
const order = new OrderDetailPage();
const MOUSE = 'Wireless Mouse'; // SKU-1001, R450.00

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC7
  it('T-UI-ORD-010: Rapid double submission creates only one order', () => {
    // Arrange
    cy.intercept('POST', '**/orders').as('createOrder');
    create.visit();
    create.setQuantity(MOUSE, 1);

    // Act: double-click Create Order
    cy.get('[data-testid="create-order"]').dblclick();

    // Assert: wait until every request has finished, then count the orders that were created
    cy.get('@createOrder.all').should((calls) => {
      expect(calls.length, 'create-order requests').to.be.gte(1);
      expect(
        calls.every((c) => c.state === 'Complete'),
        'all requests complete',
      ).to.eq(true);
    });
    cy.get('@createOrder.all').then((calls) => {
      const created = calls.filter((c) => c.response && c.response.statusCode === 201);
      created.forEach((c) => trackOrder(c.response.body.OrderId)); // clean up whatever was created
      expect(created.length, 'orders created by a double-click').to.eq(1);
    });
  });
});
