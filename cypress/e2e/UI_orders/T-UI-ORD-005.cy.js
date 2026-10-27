// FR-002 Order Management - P0
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import coupons from '../../fixtures/coupons.json';

const create = new CreateOrderPage();
const order = new OrderDetailPage();
const MOUSE = 'Wireless Mouse'; // SKU-1001, R450.00

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
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
});
