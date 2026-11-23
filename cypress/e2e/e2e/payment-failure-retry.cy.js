// P0 | T-E2E-PAY-001: Payment failure and retry
// Expected: a declined payment leaves no partial state; the retry succeeds once with exactly one charge.
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { apiUrl } from '../../support/utils';
import cards from '../../fixtures/cards.json';

const create = new CreateOrderPage();
const order = new OrderDetailPage();

// Values carried from one step to the next
const state = {};

// Run a SQL query through the cy.task('sql') defined in cypress.config.js
const sql = (query, params = {}) => cy.task('sql', { query, params });
const near = (a, b, msg) => expect(Number(a), msg).to.be.closeTo(Number(b), 0.005);

// Payment rows for the order, oldest first
const paymentRows = () =>
  sql('SELECT PaymentId, Amount, Status, TransactionRef FROM Payments WHERE OrderId = @orderId ORDER BY PaymentId', {
    orderId: state.orderId,
  });

describe('T-E2E-PAY-001: Payment failure and retry', { retries: 0 }, () => {
  before(() => {
    // Stop the global afterEach in support/e2e.js from cancelling our order between steps
    Cypress.env('keepData', true);
  });

  beforeEach(function () {
    // Steps 2-11 need the order created in Step 1
    if (!/^Step 01\b/.test(this.currentTest.title) && !state.orderId) this.skip();
  });

  after(() => {
    Cypress.env('keepData', false);
    // If the run stopped before the successful payment, cancel the unpaid order so the stock goes back
    if (state.orderId && !state.paid) {
      cy.request({ method: 'POST', url: apiUrl(`/orders/${state.orderId}/cancel`), failOnStatusCode: false });
    }
  });

  // -----------------------------------------------------------------------------------------
  it('Step 01 [UI] Log in, add a product and proceed to payment -> payment page is displayed (FR-001-AC1, FR-002-AC1)', () => {
    cy.loginAs('customer1');
    create.visit();
    create.placeOrder({ items: [{ name: 'Laptop Stand', qty: 1 }] }).then((id) => {
      state.orderId = id;
      cy.log(`Order id for this run: ${id}`);
    });
    cy.then(() => {
  order.visit(state.orderId);
});
    order.status().should('eq', 'Created');
    order.cardInput().should('be.visible'); // the order page is the payment page in this app
    order.payButton().should('be.visible');
    order.totals().then((t) => {
      state.total = t.total;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 02 [UI] Pay with the declined sandbox card -> graceful decline message and the user can retry (FR-003-AC3)', () => {
    cy.loginAs('customer1');
    cy.intercept('POST', '**/payments').as('pay');
    order.visit(state.orderId);
    order.pay(cards.declined.number);

    cy.wait('@pay').then(({ response }) => {
      expect(response.statusCode, 'declined payment status code').to.eq(402);
      state.declinedPaymentId = response.body.PaymentId;
    });
    order.error().should('be.visible');
    order.success().should('not.exist');
    order.status().should('eq', 'Created'); // not paid
    order.payButton().should('be.visible'); // the user can retry
    // The message must say the card was declined, not a bare technical error such as "Request failed (402)"
    order
      .error()
      .invoke('text')
      .should('match', /declin/i);
  });

  // -----------------------------------------------------------------------------------------
  it('Step 03 [API] GET the order and its payment -> payment Declined, order still awaiting payment (FR-003-AC3, FR-007-AC1)', () => {
    cy.apiGetOrder(state.orderId).then((o) => {
      expect(o.Status, 'order status').to.eq('Created');
      expect(o.payment, 'latest payment').to.be.an('object');
      expect(o.payment.Status, 'payment status').to.eq('Declined');
      near(o.payment.Amount, o.Total, 'declined amount = order total');
      expect(o.shipment == null, 'no shipment after a declined payment').to.eq(true);
    });
  });

  it('Step 03b [API] The declined payment carries a reason code (FR-003-AC3)', () => {
    // The API returns the Payments row as is: Status and TransactionRef, but no decline reason or code
    cy.apiGetOrder(state.orderId).then((o) => {
      const reasonFields = Object.keys(o.payment).filter((k) => /reason|code/i.test(k));
      expect(reasonFields, 'a reason / decline code field on the payment').to.not.be.empty;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 04 [SQL] Declined row stored, order not Paid, no shipment - no partial state (FR-007-AC3, FR-004-AC1)', () => {
    paymentRows().then((rows) => {
      expect(rows, 'payment rows after the decline').to.have.length(1);
      expect(rows[0].Status, 'stored payment status').to.eq('Declined');
      expect(rows[0].PaymentId, 'the declined row is the one the API returned').to.eq(state.declinedPaymentId);
    });
    sql('SELECT Status FROM Orders WHERE OrderId = @orderId', { orderId: state.orderId }).then((rows) => {
      expect(rows[0].Status, 'Orders.Status').to.not.eq('Paid');
    });
    sql('SELECT COUNT(*) AS Shipments FROM Shipments WHERE OrderId = @orderId', { orderId: state.orderId }).then((rows) => {
      expect(rows[0].Shipments, 'shipments for the unpaid order').to.eq(0);
    });
  });

  it('Step 04b [SQL] The Payments table stores a reason for the decline (FR-003-AC3)', () => {
    sql(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'Payments' AND (COLUMN_NAME LIKE '%Reason%' OR COLUMN_NAME LIKE '%Code%')`,
    ).then((rows) => {
      expect(rows, 'a reason / code column on Payments').to.not.be.empty;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 05 [UI] Retry with an invalid CVV -> validation rejects it before any charge (FR-003-AC1)', () => {
    // The UI has no CVV field (it sends 123), so the CVV is changed in flight, as in T-UI-PAY-004
    cy.intercept('POST', '**/payments', (req) => {
      req.body = { ...req.body, cvv: '12' };
    }).as('pay');
    cy.loginAs('customer1');
    order.visit(state.orderId);
    order.pay(cards.approved.number);

    cy.wait('@pay').its('response.statusCode').should('be.within', 400, 499);
    order.error().should('be.visible');
    order.success().should('not.exist');
    order.status().should('eq', 'Created');
    // No charge was recorded: still only the earlier declined row
    paymentRows().then((rows) => {
      expect(rows, 'payment rows after the rejected CVV').to.have.length(1);
      expect(rows[0].Status).to.eq('Declined');
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 06 [UI] Retry with a valid card -> payment succeeds, order Paid (FR-003-AC2)', () => {
    cy.loginAs('customer1');
    order.visit(state.orderId);
    order.pay(cards.approved.number);
    order.success().should('be.visible').invoke('text').should('match', /payment\s+approved/i);
    order.status().should('eq', 'Paid');
    cy.then(() => {
      state.paid = true;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 07 [API] GET the order payment -> latest payment is Approved for the order total (FR-003-AC4)', () => {
    // The API has no list of payments: GET /orders/{id} returns only the latest payment.
    // The earlier declined attempt is checked in Step 8 (SQL).
    cy.apiGetOrder(state.orderId).then((o) => {
      expect(o.Status, 'order status').to.eq('Paid');
      expect(o.payment.Status, 'latest payment status (this system uses Approved)').to.eq('Approved');
      near(o.payment.Amount, o.Total, 'payment amount = order total');
      expect(o.payment.PaymentId, 'the retry created a new payment').to.not.eq(state.declinedPaymentId);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 08 [SQL] One Approved payment, declined attempt retained, charged total = order total (FR-003-AC4, FR-007-AC4)', () => {
    paymentRows().then((rows) => {
      const approved = rows.filter((r) => r.Status === 'Approved');
      const declined = rows.filter((r) => r.Status === 'Declined');
      expect(approved, 'approved payments').to.have.length(1);
      expect(declined, 'declined attempt kept for audit').to.have.length(1);
      expect(rows, 'no other payment rows').to.have.length(2);
      near(approved[0].Amount, state.total, 'charged total = order total');
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 09 [UI] Re-submit the payment confirmation -> no second charge is made (FR-003-AC4)', () => {
    cy.loginAs('customer1');
    order.visit(state.orderId);
    // The page no longer offers Pay for a paid order
    cy.get('[data-testid="pay-button"]').should('not.exist');
    // Replay the same payment request, as a double-click or a network retry would
    cy.request({
      method: 'POST',
      url: apiUrl('/payments'),
      failOnStatusCode: false,
      body: { orderId: state.orderId, cardNumber: cards.approved.number, expiry: cards.approved.expiry, cvv: cards.approved.cvv },
    }).then((res) => {
      expect(res.status, 'a second payment for a paid order is rejected').to.be.within(400, 499);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 10 [SQL] Re-run payment and order integrity checks -> one successful payment, no orphan or partial records (FR-007-AC3)', () => {
    paymentRows().then((rows) => {
      expect(rows.filter((r) => r.Status === 'Approved'), 'successful payments still exactly one').to.have.length(1);
    });
    sql('SELECT PaymentId FROM Payments WHERE OrderId NOT IN (SELECT OrderId FROM Orders)').then((rows) => {
      expect(rows, 'payments with no order').to.be.empty;
    });
    sql("SELECT OrderId FROM Orders WHERE Status = 'Paid' AND OrderId NOT IN (SELECT OrderId FROM Payments)").then((rows) => {
      expect(rows, 'Paid orders with no payment').to.be.empty;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 11 [API] GET the shipment -> exactly one shipment created after payment was confirmed (FR-004-AC1)', () => {
    cy.request(apiUrl(`/shipments/order/${state.orderId}`)).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.TrackingNumber, 'tracking number').to.match(/^TRK-\d{6}$/);
      expect(res.body.Status, 'new shipment status').to.eq('Preparing');
    });
    sql('SELECT COUNT(*) AS Shipments FROM Shipments WHERE OrderId = @orderId', { orderId: state.orderId }).then((rows) => {
      expect(rows[0].Shipments, 'shipments for the order').to.eq(1);
    });
  });
});