// FR-002 Order Management - P0
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { COUPON_RATE, round2, TAX_RATE } from '../../support/utils';
import coupons from '../../fixtures/coupons.json';

const create = new CreateOrderPage();
const order = new OrderDetailPage();
const MOUSE = 'Wireless Mouse'; // SKU-1001, R450.00
const LAMP = 'Desk Lamp'; // SKU-1003, R320.00

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
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
});
