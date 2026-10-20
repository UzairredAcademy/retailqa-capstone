// FR-002 Order Management - P0
import { CreateOrderPage } from '../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../support/pages/OrderDetailPage';
import { checkOrderTotals } from '../support/flows';
import { COUPON_RATE, round2, TAX_RATE, trackOrder } from '../support/utils';
import coupons from '../fixtures/coupons.json';

const create = new CreateOrderPage();
const order = new OrderDetailPage();

const MOUSE = 'Wireless Mouse'; // SKU-1001, R450.00
const LAMP = 'Desk Lamp'; // SKU-1003, R320.00
const DOCK = 'USB-C Dock'; // SKU-1004, R1250.00, stock 5
const STAND = 'Laptop Stand'; // SKU-1005, R680.00, stock 12

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
        req.body.items = [{ productId: req.body.items[0].productId, quantity: -1 }];
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

  // FR-002-AC2
  it('T-UI-ORD-003: Order total equals items x price + tax', () => {
    checkOrderTotals();
  });

  // FR-002-AC3
  it('T-UI-ORD-004: Valid coupon code applies the correct discount', () => {
    // Arrange
    create.visit();
    create.priceOf(MOUSE).then((mouse) => {
      create.priceOf(LAMP).then((lamp) => {
        const subtotal = round2(mouse * 2 + lamp);
        const discount = round2(subtotal * COUPON_RATE);

        // Act
        create
          .placeOrder({
            items: [
              { name: MOUSE, qty: 2 },
              { name: LAMP, qty: 1 },
            ],
            coupon: coupons.valid,
          })
          .then((id) => {
            // Assert
            order.visit(id);
            order.totals().then((t) => {
              expect(t.subtotal, 'subtotal').to.be.closeTo(subtotal, 0.01);
              expect(t.discount, 'SAVE10 = 10% of the item subtotal').to.be.closeTo(discount, 0.01);
              // The pack does not say whether tax is taken before or after the discount: accept either,
              // but the figures must add up.
              const taxBefore = round2(subtotal * TAX_RATE);
              const taxAfter = round2((subtotal - discount) * TAX_RATE);
              expect(
                Math.abs(t.tax - taxBefore) <= 0.01 || Math.abs(t.tax - taxAfter) <= 0.01,
                `tax ${t.tax} is 15% of the subtotal (${taxBefore}) or of the discounted subtotal (${taxAfter})`,
              ).to.eq(true);
              expect(t.total, 'total = subtotal - discount + tax').to.be.closeTo(
                round2(t.subtotal - t.discount + t.tax),
                0.01,
              );
            });
          });
      });
    });
  });

  // FR-002-AC3
  it('T-UI-ORD-005: Invalid, expired or already-used coupon is rejected', () => {
    // Expired / already-used codes are not supplied in the pack - ask the facilitator and add them here.
    const cases = [
      { label: 'invalid code', code: coupons.invalid },
      { label: 'blank code', code: coupons.blank },
      { label: 'wrong-case code', code: coupons.wrongCase },
    ];
    cases.forEach(({ label, code }) => {
      // Arrange + Act
      create.visit();
      create.setQuantity(MOUSE, 1);
      create.setCoupon(code);
      create.submit();

      // Assert: rejected with a message, or accepted without any discount
      cy.get('.error, .success')
        .should('be.visible')
        .then(($message) => {
          if ($message.hasClass('error')) {
            cy.log(`${label}: rejected - "${$message.text()}"`);
            return;
          }
          create.createdOrderId().then((id) => {
            order.visit(id);
            order.totals().then((t) => {
              expect(t.discount, `${label}: no discount applied`).to.eq(0);
            });
          });
        });
    });
  });

  // FR-002-AC4
  it.skip('T-UI-ORD-006: Order quantity can be modified before payment and totals recalculate [BLOCKED - the order page has no edit control]', () => {
    // Arrange: an unpaid order for SKU-1001 x2 (cy.apiCreateOrder)
    // Act: open the order, change a line quantity from 2 to 4, save
    // Assert: line total, tax and total recalculate and persist after a refresh
    // The order details page only offers Pay / Cancel for an unpaid order, so there is nothing to click.
    // The API contract has PUT /orders/{orderId} - covered by T-API-ORD-007. Raise with the facilitator
    // whether the UI is meant to offer this; if it does, implement the steps above with its selectors.
  });

  // FR-002-AC4
  it.skip('T-UI-ORD-007: Delivery address can be changed before payment [BLOCKED - the order page has no edit control]', () => {
    // Arrange: an unpaid order; Act: change the delivery address and save;
    // Assert: new address shown on the order and persists after refresh.
    // The only address field is on the New Order form (before the order exists). See T-UI-ORD-006.
  });

  // FR-002-AC5
  it('T-UI-ORD-008: Order cannot be modified after payment', () => {
    // Arrange
    cy.apiCreatePaidOrder({ sku: 'SKU-1005', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);

      // Assert: paid, and nothing on the page lets the customer change or pay again
      order.status().should('eq', 'Paid');
      cy.get('main input').should('not.exist');
      cy.contains('button', 'Pay').should('not.exist');
      cy.contains('button', 'Cancel').should('not.exist');
      cy.contains('button, a', /edit|change|modify|update/i).should('not.exist');
    });
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
