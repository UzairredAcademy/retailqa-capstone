// P0 | T-E2E-ORD-001: Complete order lifecycle (login to delivery)
// Expected: order is created, paid, shipped and delivered; UI, API and DB values agree at every checkpoint.
import { LoginPage } from '../../support/pages/LoginPage';
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { apiUrl, credentials, money, round2, TAX_RATE, COUPON_RATE } from '../../support/utils';
import cards from '../../fixtures/cards.json';

const create = new CreateOrderPage();
const order = new OrderDetailPage();

// Values carried from one step to the next
const state = {};

// Run a SQL query through the cy.task('sql') defined in cypress.config.js
const sql = (query, params = {}) => cy.task('sql', { query, params });
const near = (a, b, msg) => expect(Number(a), msg).to.be.closeTo(Number(b), 0.005);

describe('T-E2E-ORD-001: Complete order lifecycle (login to delivery)', { retries: 0 }, () => {
  before(() => {
    // Stop the global afterEach in support/e2e.js from cancelling our order between steps
    Cypress.env('keepData', true);
  });

  beforeEach(function () {
    // Steps 3-13 need the order created in Step 2
    if (!/^Step 0[12]\b/.test(this.currentTest.title) && !state.orderId) this.skip();
  });

  after(() => {
    Cypress.env('keepData', false);
    // If the run stopped before payment, cancel the unpaid order so the stock goes back
    if (state.orderId && !state.paid) {
      cy.request({ method: 'POST', url: apiUrl(`/orders/${state.orderId}/cancel`), failOnStatusCode: false });
    }
  });

  // -----------------------------------------------------------------------------------------
  it('Step 01 [UI] Log in with a valid customer account -> Dashboard is displayed (FR-001-AC1)', () => {
    const { email, password } = credentials('customer1');
    new LoginPage().visit().loginWith(email, password);
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('h1', 'Dashboard').should('be.visible');
  });

  // -----------------------------------------------------------------------------------------
  it('Step 02 [UI] Add two products with valid quantities and apply SAVE10 -> order shows discount and total (FR-002-AC1, FR-002-AC3)', () => {
    cy.loginAs('customer1');
    create.visit();
    create.priceOf('Wireless Mouse').then((mouse) =>
      create.priceOf('Desk Lamp').then((lamp) =>
        create.stockOf('Wireless Mouse').then((mouseStock) =>
          create.stockOf('Desk Lamp').then((lampStock) => {
            expect(mouseStock, 'Wireless Mouse stock (run RESET_SYSTEM.bat if too low)').to.be.at.least(2);
            expect(lampStock, 'Desk Lamp stock (run RESET_SYSTEM.bat if too low)').to.be.at.least(1);
            state.stockBefore = { 'Wireless Mouse': mouseStock, 'Desk Lamp': lampStock };
            state.qty = { 'Wireless Mouse': 2, 'Desk Lamp': 1 };

            // Independent calculation from the prices shown on the product cards
            const subtotal = round2(mouse * 2 + lamp);
            const tax = round2(subtotal * TAX_RATE);
            const discount = round2(subtotal * COUPON_RATE); // SAVE10 = 10% of the item subtotal
            state.expected = { subtotal, tax, discount, total: round2(subtotal + tax - discount) };

            create
              .placeOrder({
                items: [
                  { name: 'Wireless Mouse', qty: 2 },
                  { name: 'Desk Lamp', qty: 1 },
                ],
                coupon: 'SAVE10',
              })
              .then((id) => {
                state.orderId = id;
                cy.log(`Order id for this run: ${id}`);
                create
                  .success()
                  .invoke('text')
                  .then((text) => near(money(text.split('Total')[1]), state.expected.total, 'total shown after creating the order'));
              });
          }),
        ),
      ),
    );
  });

  // -----------------------------------------------------------------------------------------
  it('Step 03 [UI] Capture the displayed subtotal, discount, tax and total (FR-002-AC2)', () => {
    cy.loginAs('customer1');
    order.visit(state.orderId);
    order.itemLine('Wireless Mouse', 2).should('be.visible');
    order.itemLine('Desk Lamp', 1).should('be.visible');
    order.totals().then((t) => {
      state.ui = t; // stored for comparison in Steps 4, 7 and 13
      near(t.subtotal, state.expected.subtotal, 'UI subtotal');
      near(t.tax, state.expected.tax, 'UI tax (15% of subtotal)');
      near(t.discount, state.expected.discount, 'UI discount (SAVE10 = 10%)');
      near(t.total, state.expected.total, 'UI total');
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 04 [API] GET the order and compare with the captured UI values (FR-007-AC1)', () => {
    cy.apiGetOrder(state.orderId).then((o) => {
      near(o.Subtotal, state.ui.subtotal, 'API subtotal = UI subtotal');
      near(o.TaxAmount, state.ui.tax, 'API tax = UI tax');
      near(o.DiscountAmount, state.ui.discount, 'API discount = UI discount');
      near(o.Total, state.ui.total, 'API total = UI total');
      expect(o.CouponCode, 'coupon').to.eq('SAVE10');
      expect(o.items, 'order lines').to.have.length(2);
      expect(o.shipment == null, 'no shipment exists before payment').to.eq(true);
      state.items = o.items;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 05 [UI] Pay with a valid sandbox card -> payment confirmation is displayed (FR-003-AC2)', () => {
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
  it('Step 06 [API] Payment for the order is Approved and the amount equals the order total (FR-003-AC2, FR-007-AC1)', () => {
    // The API has no GET /payments endpoint; the payment is returned inside GET /orders/{id}
    cy.apiGetOrder(state.orderId).then((o) => {
      expect(o.payment, 'payment object').to.be.an('object');
      expect(o.payment.Status, 'payment status (this system uses Approved)').to.eq('Approved');
      near(o.payment.Amount, o.Total, 'payment amount = order total');
      near(o.payment.Amount, state.ui.total, 'payment amount = UI total');
      expect(o.payment.TransactionRef, 'transaction reference').to.match(/^TX-/);
      state.paymentCreatedAt = o.payment.CreatedAt;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 07 [SQL] Order = Paid, exactly one approved payment, Orders.Total = Payments.Amount = UI total (FR-007-AC2, FR-007-AC4)', () => {
    sql(
      `SELECT o.Status, o.Total,
              (SELECT COUNT(*) FROM Payments WHERE OrderId = o.OrderId AND Status = 'Approved') AS ApprovedPayments,
              (SELECT SUM(Amount) FROM Payments WHERE OrderId = o.OrderId AND Status = 'Approved') AS PaidAmount
       FROM Orders o WHERE o.OrderId = @orderId`,
      { orderId: state.orderId },
    ).then((rows) => {
      expect(rows, 'order row').to.have.length(1);
      const r = rows[0];
      expect(r.Status, 'Orders.Status').to.eq('Paid');
      expect(r.ApprovedPayments, 'successful payments').to.eq(1);
      near(r.PaidAmount, r.Total, 'Payments.Amount = Orders.Total');
      near(r.Total, state.ui.total, 'Orders.Total = UI total');
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 08 [API] GET the shipment -> created after payment, tracking number assigned (FR-004-AC1, FR-004-AC2)', () => {
    cy.request(apiUrl(`/shipments/order/${state.orderId}`)).then((res) => {
      expect(res.status).to.eq(200);
      const s = res.body;
      expect(s.TrackingNumber, 'tracking number').to.match(/^TRK-\d{6}$/);
      expect(s.Status, 'new shipment status').to.eq('Preparing');
      expect(new Date(s.CreatedAt).getTime(), 'shipment created after payment').to.be.at.least(
        new Date(state.paymentCreatedAt).getTime() - 1000,
      );
      state.shipmentId = s.ShipmentId;
      state.tracking = s.TrackingNumber;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 09 [SQL] Shipment row has a unique tracking number and stock is reduced by the ordered quantities (FR-004-AC1, FR-007-AC2)', () => {
    sql('SELECT ShipmentId, TrackingNumber, Status FROM Shipments WHERE OrderId = @orderId', { orderId: state.orderId }).then((rows) => {
      expect(rows, 'one shipment row for the order').to.have.length(1);
      expect(rows[0].TrackingNumber, 'tracking number = API tracking number').to.eq(state.tracking);
    });
    sql('SELECT COUNT(*) AS Uses FROM Shipments WHERE TrackingNumber = @t', { t: state.tracking }).then((rows) => {
      expect(rows[0].Uses, 'tracking number is unique').to.eq(1);
    });
    sql(
      `SELECT p.Name, p.StockQuantity, SUM(l.ChangeQuantity) AS LedgerTotal
       FROM InventoryLedger l JOIN Products p ON p.ProductId = l.ProductId
       WHERE l.OrderId = @orderId GROUP BY p.Name, p.StockQuantity`,
      { orderId: state.orderId },
    ).then((rows) => {
      expect(rows, 'ledger rows for the two products').to.have.length(2);
      rows.forEach((r) => {
        const qty = state.qty[r.Name];
        expect(r.LedgerTotal, `${r.Name} ledger entry`).to.eq(-qty);
        expect(r.StockQuantity, `${r.Name} stock = before - ordered`).to.eq(state.stockBefore[r.Name] - qty);
      });
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 10 [API] Update the shipment to Shipped, then Delivered -> statuses update in order (FR-004-AC3)', () => {
    const put = (status) =>
      cy.request({ method: 'PUT', url: apiUrl(`/shipments/${state.shipmentId}/status`), body: { status } });
    put('Shipped').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.Status).to.eq('Shipped');
    });
    cy.request(apiUrl(`/shipments/order/${state.orderId}`)).its('body.Status').should('eq', 'Shipped');
    put('Delivered').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.Status).to.eq('Delivered');
    });
    cy.request(apiUrl(`/shipments/order/${state.orderId}`)).its('body.Status').should('eq', 'Delivered');
  });

  // BLOCKED: the API has no way to send or store a proof of delivery (see the T-API-DEL-003 blocker)
  it.skip('Step 10b [API] Deliver with proof of delivery -> POD stored (FR-004-AC5) - BLOCKED: POD not integrated', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 11 [SQL] Notification logged once for Shipped and once for Delivered (FR-004-AC4)', () => {
    // There is no NotificationLog table: notifications are recorded in AuditLog as "Customer notification queued"
    sql(
      `SELECT Action, COUNT(*) AS Notifications
       FROM AuditLog
       WHERE EntityType = 'Shipment' AND EntityId = @shipmentId AND Details LIKE '%notification queued%'
       GROUP BY Action`,
      { shipmentId: state.shipmentId },
    ).then((rows) => {
      const by = Object.fromEntries(rows.map((r) => [r.Action, r.Notifications]));
      expect(by.Shipped, 'Shipped notifications').to.eq(1);
      expect(by.Delivered, 'Delivered notifications').to.eq(1);
    });
  });

  // BLOCKED: only a "POD-PENDING recorded" audit note exists; there is no ProofOfDelivery table or record
  it.skip('Step 11b [SQL] ProofOfDelivery record exists (FR-004-AC5) - BLOCKED: POD not integrated', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 12 [UI] Order details page shows the tracking number and Delivered status, equal to the API values (FR-004-AC3, FR-007-AC1)', () => {
    cy.loginAs('customer1');
    order.visit(state.orderId);
    order.status().should('eq', 'Paid'); // the order stays Paid; the delivery state lives on the shipment
    order.tracking().then(({ number, status }) => {
      expect(number, 'tracking number on the page').to.eq(state.tracking);
      expect(status, 'shipment status on the page').to.eq('Delivered');
    });
    cy.apiGetOrder(state.orderId).then((o) => {
      expect(o.shipment.TrackingNumber, 'API tracking number').to.eq(state.tracking);
      expect(o.shipment.Status, 'API shipment status').to.eq('Delivered');
    });
  });

  // BLOCKED: the order page has no POD element
  it.skip('Step 12b [UI] Proof of delivery is displayed on the order page (FR-004-AC5) - BLOCKED: POD not integrated', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 13 [SQL] Cross-layer reconciliation: UI = API = DB totals, report saved as evidence (FR-007-AC4)', () => {
    sql(
      `SELECT o.OrderId, o.Subtotal, o.TaxAmount, o.DiscountAmount, o.Total,
              (SELECT SUM(LineTotal) FROM OrderItems WHERE OrderId = o.OrderId) AS LinesTotal,
              (SELECT SUM(Amount) FROM Payments WHERE OrderId = o.OrderId AND Status = 'Approved') AS PaidAmount
       FROM Orders o WHERE o.OrderId = @orderId`,
      { orderId: state.orderId },
    ).then(([db]) => {
      cy.apiGetOrder(state.orderId).then((api) => {
        const layers = {
          ui: state.ui,
          api: { subtotal: api.Subtotal, tax: api.TaxAmount, discount: api.DiscountAmount, total: api.Total },
          db: { subtotal: db.Subtotal, tax: db.TaxAmount, discount: db.DiscountAmount, total: db.Total },
        };
        const differences = [];
        ['subtotal', 'tax', 'discount', 'total'].forEach((f) => {
          const values = [layers.ui[f], layers.api[f], layers.db[f]].map(Number);
          if (Math.max(...values) - Math.min(...values) > 0.005) differences.push({ field: f, ui: values[0], api: values[1], db: values[2] });
        });
        if (Math.abs(Number(db.LinesTotal) - Number(db.Subtotal)) > 0.005) differences.push({ field: 'lines vs subtotal', lines: db.LinesTotal, subtotal: db.Subtotal });
        if (Math.abs(Number(db.PaidAmount) - Number(db.Total)) > 0.005) differences.push({ field: 'payment vs total', paid: db.PaidAmount, total: db.Total });

        const report = { test: 'T-E2E-ORD-001', orderId: state.orderId, tracking: state.tracking, layers, db, differences };
        cy.writeFile('reports/e2e/T-E2E-ORD-001-reconciliation.json', report);
        expect(differences, 'differences between UI, API and DB').to.deep.equal([]);
      });
    });
  });
});