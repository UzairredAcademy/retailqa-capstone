// FR-003 Payment Processing - P0
import { OrderDetailPage } from '../support/pages/OrderDetailPage';
import cards from '../fixtures/cards.json';

const order = new OrderDetailPage();

describe('Payment Processing', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
    // Arrange: an unpaid order for one Laptop Stand (SKU-1005)
    cy.apiCreateOrder({ sku: 'SKU-1005', quantity: 1 }).its('OrderId').as('orderId');
  });

  /**
   * The UI only has a card-number field - expiry (12/30) and CVV (123) are sent with fixed values.
   * To test expiry/CVV validation through the real UI flow, the payment request is changed in flight.
   * Returns a function that sets the fields to override on the next payment request.
   */
  const overridePaymentFields = () => {
    let override = {};
    cy.intercept('POST', '**/payments', (req) => {
      req.body = { ...req.body, ...override };
    }).as('payment');
    return (fields) => {
      override = fields;
    };
  };

  // FR-003-AC2
  it('T-UI-PAY-001: Payment with a valid card succeeds', () => {
    cy.get('@orderId').then((id) => {
      // Act
      order.visit(id);
      order.pay(cards.approved.number);

      // Assert
      order
        .success()
        .should('be.visible')
        .invoke('text')
        .should('match', /payment\s+approved/i);
      order.status().should('eq', 'Paid');
      order.paymentLine().should('contain', 'Approved');
      cy.contains('button', 'Pay').should('not.exist');
    });
  });

  // FR-003-AC1
  it('T-UI-PAY-002: Invalid card number format is rejected', () => {
    // The pack lists 1234 as the invalid-format card. A 16-digit number that fails the Luhn check is not
    // included: the pack does not say the system checks Luhn, so it is left out to avoid a false defect.
    const invalidNumbers = [cards.invalidFormat.number, 'abcdefghijklmnop', ''];
    cy.get('@orderId').then((id) => {
      invalidNumbers.forEach((number) => {
        // Act
        order.visit(id);
        order.pay(number);

        // Assert
        order.error().should('be.visible');
        order.success().should('not.exist');
        order.status().should('eq', 'Created');
        order.paymentLine().should('not.exist');
      });
    });
  });

  // FR-003-AC1
  it('T-UI-PAY-003: Expired card is rejected', () => {
    const setOverride = overridePaymentFields();
    cy.get('@orderId').then((id) => {
      // Act: expiry in the past (01/20)
      cy.then(() => setOverride({ expiry: cards.expired.expiry }));
      order.visit(id);
      order.pay(cards.approved.number);

      // Assert
      cy.wait('@payment').its('response.statusCode').should('be.within', 400, 499);
      order.error().should('be.visible');
      order.status().should('eq', 'Created');

      // Boundary: the current month/year is accepted
      const now = new Date();
      const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(
        now.getFullYear(),
      ).slice(-2)}`;
      cy.then(() => setOverride({ expiry: currentMonth }));
      order.visit(id);
      order.pay(cards.approved.number);
      cy.wait('@payment').its('response.statusCode').should('eq', 201);
      order.status().should('eq', 'Paid');
    });
  });

  // FR-003-AC1
  it('T-UI-PAY-004: Invalid CVV is rejected', () => {
    const setOverride = overridePaymentFields();
    // The pack does not state the CVV rules; 3 digits is the standard for the supplied test cards.
    const invalidCvvs = [
      { label: '2-digit CVV', cvv: '12' },
      { label: 'non-numeric CVV', cvv: 'abc' },
      { label: 'empty CVV', cvv: '' },
    ];
    cy.get('@orderId').then((id) => {
      invalidCvvs.forEach(({ label, cvv }) => {
        // Act
        cy.then(() => setOverride({ cvv }));
        order.visit(id);
        order.pay(cards.approved.number);

        // Assert
        cy.wait('@payment')
          .its('response.statusCode')
          .should('be.within', 400, 499, `${label} rejected`);
        order.error().should('be.visible');
        order.status().should('eq', 'Created');
      });
    });
  });

  // FR-003-AC3
  it('T-UI-PAY-005: Declined card is handled gracefully', () => {
    cy.get('@orderId').then((id) => {
      // Act
      order.visit(id);
      order.pay(cards.declined.number);

      // Assert: friendly message (no technical detail), order still unpaid, payment can be retried
      order
        .error()
        .should('be.visible')
        .invoke('text')
        .then((text) => {
          expect(text.trim(), 'decline message').to.not.be.empty;
          expect(text, 'no technical error details').to.not.match(
            /stack|exception|undefined|\[object|sql|econn|internal server|<html/i,
          );
        });
      order.status().should('eq', 'Created');
      order.payButton().should('be.visible').and('be.enabled');
    });
  });

  // FR-003-AC4
  it('T-UI-PAY-006: Double-clicking Pay does not charge twice', () => {
    cy.intercept('POST', '**/payments').as('payments');
    cy.get('@orderId').then((id) => {
      // Arrange
      order.visit(id);
      order.cardInput().clear();
      order.cardInput().type(cards.approved.number);

      // Act
      order.payButton().dblclick();

      // Assert: wait for every payment request to finish, then count the successful charges
      cy.get('@payments.all').should((calls) => {
        expect(calls.length, 'payment requests').to.be.gte(1);
        expect(
          calls.every((c) => c.state === 'Complete'),
          'all requests complete',
        ).to.eq(true);
      });
      cy.get('@payments.all').then((calls) => {
        const charged = calls.filter((c) => c.response && c.response.statusCode === 201);
        expect(charged.length, 'successful charges for one order').to.eq(1);
      });
      order.status().should('eq', 'Paid');
    });
  });
});
