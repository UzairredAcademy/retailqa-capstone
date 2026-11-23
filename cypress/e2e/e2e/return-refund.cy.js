// P1 | T-E2E-RET-001: Return and refund processing
// Expected: a valid return is refunded to the original method, stock is restored, the audit trail is complete,
// and an out-of-window return is refused.
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { OrdersPage } from '../../support/pages/OrdersPage';
import { apiUrl, round2, TAX_RATE } from '../../support/utils';

const order = new OrderDetailPage();
const orders = new OrdersPage();

const SKU = 'SKU-1005'; // Laptop Stand
const QTY = 2;

// Values carried from one step to the next
const state = {};

// Run a SQL query through the cy.task('sql') defined in cypress.config.js
const sql = (query, params = {}) => cy.task('sql', { query, params });
const near = (a, b, msg) => expect(Number(a), msg).to.be.closeTo(Number(b), 0.005);
const stockOfSku = () => cy.apiProducts().then((ps) => ps.find((p) => p.SKU === SKU).StockQuantity);

describe('T-E2E-RET-001: Return and refund processing', { retries: 0 }, () => {
  before(() => {
    // Stop the global afterEach in support/e2e.js from cancelling our orders between steps
    Cypress.env('keepData', true);
  });

  beforeEach(function () {
    // Steps 2-11 need the delivered order created in Step 1
    if (!/^Step 01\b/.test(this.currentTest.title) && !state.orderId) this.skip();
  });

  after(() => {
    Cypress.env('keepData', false);
  });

  // -----------------------------------------------------------------------------------------
  it('Step 01 [UI] Log in and open a delivered order inside the 30-day window -> order details displayed (FR-001-AC1, FR-005-AC1)', () => {
    // Arrange through the API: a paid, shipped and delivered order of 2 x Laptop Stand (delivered just now)
    cy.apiProducts().then((products) => {
      state.price = Number(products.find((p) => p.SKU === SKU).Price);
      // Independent refund calculation: what was paid = items + 15% tax (no coupon)
      state.expectedRefund = round2(state.price * QTY * (1 + TAX_RATE));
    });
    cy.apiCreateDeliveredOrder({ sku: SKU, quantity: QTY }).then((id) => {
      state.orderId = id;
      cy.log(`Order id for this run: ${id}`);
    });
    stockOfSku().then((stock) => {
      state.stockAfterOrder = stock; // stock with the order's items still out
    });

    cy.loginAs('customer1');
    cy.then(() => { order.visit(state.orderId); });
    order.status().should('eq', 'Paid');
    order.tracking().its('status').should('eq', 'Delivered');
    cy.contains('button', 'Request Return').should('be.visible');
  });

  // -----------------------------------------------------------------------------------------
  it('Step 02 [UI] Initiate a return with a reason -> return created (FR-005-AC1)', () => {
    cy.intercept('POST', '**/returns').as('returnRequest');
    cy.loginAs('customer1');
    order.visit(state.orderId);
    order.requestReturn(); // the app sends the reason "Customer return request"
    cy.wait('@returnRequest').then(({ response }) => {
      expect(response.statusCode, 'return request status').to.eq(201);
      state.ret = response.body; // {ReturnId, OrderId, Reason, Status, RefundAmount, CreatedAt}
    });
    order.success().should('be.visible').invoke('text').should('match', /Return #\d+ created/);
  });

  // -----------------------------------------------------------------------------------------
  it('Step 03 [API] The return exists and the within-window check passed (FR-005-AC1, FR-007-AC1)', () => {
    // The API has no GET /returns endpoint: the return is the response to POST /returns (Step 2)
    expect(state.ret.ReturnId, 'return id').to.be.a('number');
    expect(state.ret.OrderId, 'return is for our order').to.eq(state.orderId);
    expect(state.ret.Reason, 'reason stored').to.not.be.empty;
    // A second return for the same order is refused, which proves exactly one return exists
    cy.request({
      method: 'POST',
      url: apiUrl('/returns'),
      failOnStatusCode: false,
      body: { orderId: state.orderId, reason: 'Second attempt' },
    })
      .its('status')
      .should('eq', 409);
  });

  it('Step 03b [API] The new return has status Requested (FR-005-AC1)', () => {
    expect(state.ret.Status, 'status of a newly created return').to.eq('Requested');
  });

  // -----------------------------------------------------------------------------------------
  // BLOCKED: no page shows a refund amount
  it.skip('Step 04 [UI] Refund amount shown equals the API refund amount (FR-005-AC2, FR-007-AC1) - BLOCKED: the UI never displays a refund amount', () => {});

  it('Step 04b [API] Refund amount equals the independently calculated refund (FR-005-AC2)', () => {
    near(state.ret.RefundAmount, state.expectedRefund, 'RefundAmount = 2 x price + 15% tax');
  });

  // -----------------------------------------------------------------------------------------
  // BLOCKED: there is no "mark received" endpoint and no warehouse role; a return is Approved at once
  it.skip('Step 05 [API] Mark the return as received (warehouse role) -> status Received (FR-005-AC4) - BLOCKED: no receive step or warehouse role', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 06 [SQL] Positive ledger entry equals the returned quantity and stock is restored (FR-005-AC4, FR-007-AC2)', () => {
    sql(
      `SELECT ProductId, ChangeQuantity, Reason FROM InventoryLedger
       WHERE OrderId = @orderId AND ChangeQuantity > 0`,
      { orderId: state.orderId },
    ).then((rows) => {
      expect(rows, 'positive ledger entries for the return').to.have.length(1);
      expect(rows[0].ChangeQuantity, 'returned quantity in the ledger').to.eq(QTY);
    });
    sql('SELECT StockQuantity FROM Products WHERE SKU = @sku', { sku: SKU }).then((rows) => {
      expect(rows[0].StockQuantity, 'stock = stock before the return + returned quantity').to.eq(state.stockAfterOrder + QTY);
    });
  });

  // -----------------------------------------------------------------------------------------
  // BLOCKED: there is no refund endpoint; the refund is issued inside POST /returns
  it.skip('Step 07 [API] Issue/confirm the refund and GET it -> refund references the original payment and method (FR-005-AC3, FR-003-AC5) - BLOCKED: no refund endpoint', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 08 [SQL] Refund recorded against the order; amount <= amount paid; totals consistent (FR-005-AC3, FR-007-AC4)', () => {
    sql('SELECT PaymentId, Amount, Status FROM Payments WHERE OrderId = @orderId ORDER BY PaymentId', { orderId: state.orderId }).then((rows) => {
      const paid = rows.find((r) => r.Status === 'Approved');
      const refund = rows.find((r) => r.Status === 'Refunded');
      expect(paid, 'original approved payment').to.be.an('object');
      expect(refund, 'refund row').to.be.an('object');
      expect(Math.abs(Number(refund.Amount)), 'refund <= amount paid').to.be.at.most(Number(paid.Amount) + 0.005);
      near(Math.abs(refund.Amount), state.expectedRefund, 'refund = independent calculation');
      near(rows.reduce((sum, r) => sum + Number(r.Amount), 0), 0, 'paid + refund nets to zero');
    });
  });

  // BLOCKED: Payments has no method column and no link from a refund to the original payment
  it.skip('Step 08b [SQL] Refund is linked to the original payment and method (FR-005-AC3) - BLOCKED: no payment method or payment link column', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 09 [SQL] AuditLog has Requested, Received and Refunded events for the return, in order (FR-005-AC5)', () => {
    // Refunds are audited as EntityType "Return" with the OrderId as EntityId
    sql(
      `SELECT Action FROM AuditLog WHERE EntityType = 'Return' AND EntityId = @orderId ORDER BY AuditId`,
      { orderId: state.orderId },
    ).then((rows) => {
      expect(rows.map((r) => r.Action), 'return audit events in order').to.deep.equal(['Requested', 'Received', 'Refunded']);
    });
  });

  it('Step 09b [SQL] Each audit entry records the actor (FR-005-AC5)', () => {
    sql(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'AuditLog' AND (COLUMN_NAME LIKE '%Actor%' OR COLUMN_NAME LIKE '%User%')`,
    ).then((rows) => {
      expect(rows, 'an actor / user column on AuditLog').to.not.be.empty;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 10 [UI] Order page and order history show the order as returned (FR-005-AC2, FR-005-AC3)', () => {
    cy.loginAs('customer1');
    order.visit(state.orderId);
    order.status().should('eq', 'Returned'); // the only status the app shows for a refunded order
    cy.contains('button', 'Request Return').should('be.visible'); // still offered; a second attempt is refused in the API (Step 3)
    orders.visit();
    orders.expectRows((rows) => {
      const row = rows.find((r) => r.id === state.orderId);
      expect(row, `order ${state.orderId} in the order history`).to.be.an('object');
      expect(row.status, 'status in the order history').to.eq('Returned');
    });
  });

  // BLOCKED: the UI has no return page and shows no refund amount or payment method
  it.skip('Step 10b [UI] Refund amount and original payment method are displayed (FR-005-AC2, FR-005-AC3) - BLOCKED: not displayed anywhere in the UI', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 11 [UI+API+SQL] Return an order delivered more than 30 days ago -> refused with a policy message, no return or refund rows (FR-005-AC1)', () => {
    // Arrange: a second delivered order, back-dated to 31 days ago
    cy.apiCreateDeliveredOrder({ sku: SKU, quantity: 1 }).then((id) => {
      state.oldOrderId = id;
      sql(
        `UPDATE Shipments
         SET CreatedAt = DATEADD(DAY, -31, SYSUTCDATETIME()), DeliveredAt = DATEADD(DAY, -31, SYSUTCDATETIME())
         WHERE OrderId = @orderId`,
        { orderId: id },
      );
    });

    // UI: the return is refused with a message about the return window
    cy.intercept('POST', '**/returns').as('oldReturn');
    cy.loginAs('customer1');
    cy.then(() => { order.visit(state.oldOrderId); });
    order.requestReturn();
    cy.wait('@oldReturn').its('response.statusCode').should('be.within', 400, 499);
    order.error().should('be.visible').invoke('text').should('match', /window|30|days|expired/i);
    order.success().should('not.exist');

    // API: the same request is refused
    cy.then(() =>
      cy.request({
        method: 'POST',
        url: apiUrl('/returns'),
        failOnStatusCode: false,
        body: { orderId: state.oldOrderId, reason: 'Too late' },
      }),
    )
      .its('status')
      .should('be.within', 400, 499);

    // SQL: nothing was created
    cy.then(() => sql('SELECT COUNT(*) AS Returns FROM Returns WHERE OrderId = @orderId', { orderId: state.oldOrderId })).then((rows) => {
      expect(rows[0].Returns, 'return rows for the old order').to.eq(0);
    });
    cy.then(() => sql("SELECT COUNT(*) AS Refunds FROM Payments WHERE OrderId = @orderId AND Status = 'Refunded'", { orderId: state.oldOrderId })).then((rows) => {
      expect(rows[0].Refunds, 'refund rows for the old order').to.eq(0);
    });
  });
});