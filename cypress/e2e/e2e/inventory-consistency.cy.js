// P1 | T-E2E-INV-001: Inventory consistency end to end
// Expected: stock moves correctly for sale, cancellation and return; the ledger reconciles and UI = API = DB.
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { apiUrl } from '../../support/utils';
import cards from '../../fixtures/cards.json';

const create = new CreateOrderPage();
const order = new OrderDetailPage();

const SKU = 'SKU-1005';
const NAME = 'Laptop Stand';

// Values carried from one step to the next
const state = {};

// Run a SQL query through the cy.task('sql') defined in cypress.config.js
const sql = (query, params = {}) => cy.task('sql', { query, params });
const apiStock = (sku = SKU) => cy.apiProducts().then((ps) => ps.find((p) => p.SKU === sku).StockQuantity);
const dbStock = () => sql('SELECT StockQuantity FROM Products WHERE SKU = @sku', { sku: SKU }).then((rows) => rows[0].StockQuantity);

describe('T-E2E-INV-001: Inventory consistency end to end', { retries: 0 }, () => {
  before(() => {
    // Stop the global afterEach in support/e2e.js from cancelling our orders between steps
    Cypress.env('keepData', true);
  });

  beforeEach(function () {
    // Steps 3-12 need the first order created in Step 2
    if (!/^Step 0[12]\b/.test(this.currentTest.title) && !state.order1) this.skip();
  });

  after(() => {
    Cypress.env('keepData', false);
  });

  // -----------------------------------------------------------------------------------------
  it('Step 01 [SQL] Record the baseline stock S0 for Laptop Stand (SKU-1005) (FR-007-AC2)', () => {
    sql('SELECT ProductId, StockQuantity FROM Products WHERE SKU = @sku', { sku: SKU }).then((rows) => {
      expect(rows, 'product row').to.have.length(1);
      state.pid = rows[0].ProductId;
      state.s0 = rows[0].StockQuantity;
      expect(state.s0, 'S0 (run RESET_SYSTEM.bat if too low)').to.be.at.least(5);
      cy.log(`S0 = ${state.s0}`);
    });
    // Everything in the ledger after this point belongs to this test
    sql('SELECT ISNULL(MAX(LedgerId), 0) AS MaxLedger FROM InventoryLedger').then((rows) => {
      state.ledgerBase = rows[0].MaxLedger;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 02 [UI] Log in, order quantity 3 of the SKU and pay -> order Paid, displayed availability = S0 - 3 (FR-002-AC1, FR-003-AC2)', () => {
    cy.loginAs('customer1');
    create.visit();
    create.placeOrder({ items: [{ name: NAME, qty: 3 }] }).then((id) => {
      state.order1 = id;
      cy.log(`First order id: ${id}`);
    });
    cy.then(() => { order.visit(state.order1); });
    order.pay(cards.approved.number);
    order.success().should('be.visible').invoke('text').should('match', /payment\s+approved/i);
    order.status().should('eq', 'Paid');

    create.visit();
    create.stockOf(NAME).then((shown) => {
      state.uiAfterSale = shown;
      expect(shown, 'availability shown after the sale').to.eq(state.s0 - 3);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 03 [API] GET the product stock -> S0 - 3, matches the UI (FR-007-AC1)', () => {
    apiStock().then((stock) => {
      expect(stock, 'API stock after the sale').to.eq(state.s0 - 3);
      expect(stock, 'API stock = UI availability').to.eq(state.uiAfterSale);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 04 [SQL] Stock = S0 - 3 and the ledger has a -3 sale entry for the order (FR-007-AC2)', () => {
    dbStock().then((stock) => expect(stock, 'Products.StockQuantity').to.eq(state.s0 - 3));
    sql('SELECT ChangeQuantity, Reason FROM InventoryLedger WHERE OrderId = @orderId AND ProductId = @pid', {
      orderId: state.order1,
      pid: state.pid,
    }).then((rows) => {
      expect(rows, 'ledger entries for the first order').to.have.length(1);
      expect(rows[0].ChangeQuantity, 'sale quantity in the ledger').to.eq(-3);
      // This system calls the entry "Order reservation" (it is written when the order is created)
      expect(rows[0].Reason, 'ledger reason').to.match(/sale|reserv/i);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 05 [UI] Place a second order for quantity 2, then cancel it before shipment -> second order Cancelled (FR-002-AC6)', () => {
    cy.loginAs('customer1');
    create.visit();
    create.placeOrder({ items: [{ name: NAME, qty: 2 }] }).then((id) => {
      state.order2 = id;
      cy.log(`Second order id: ${id}`);
    });
    cy.then(() => { order.visit(state.order2); });
    order.cancel();
    order.success().should('contain', 'Order cancelled');
    order.status().should('eq', 'Cancelled');
  });

  // -----------------------------------------------------------------------------------------
  it('Step 06 [API] GET the product stock after cancellation -> back to S0 - 3 (FR-002-AC6, FR-007-AC1)', () => {
    apiStock().then((stock) => {
      expect(stock, 'API stock after the cancellation').to.eq(state.s0 - 3);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 07 [SQL] The ledger has a compensating +2 entry for the cancelled order (FR-002-AC6, FR-007-AC2)', () => {
    sql('SELECT ChangeQuantity, Reason FROM InventoryLedger WHERE OrderId = @orderId AND ProductId = @pid ORDER BY LedgerId', {
      orderId: state.order2,
      pid: state.pid,
    }).then((rows) => {
      expect(rows.map((r) => r.ChangeQuantity), 'ledger entries for the cancelled order').to.deep.equal([-2, 2]);
    });
  });

  it('Step 07b [SQL] Stock in the database is S0 - 3 after the cancellation (FR-002-AC6)', () => {
    dbStock().then((stock) => expect(stock, 'Products.StockQuantity after the cancellation').to.eq(state.s0 - 3));
  });

  // -----------------------------------------------------------------------------------------
  it('Step 08 [API] Attempt an order for more than the available stock -> rejected, stock unchanged, no partial reservation (FR-002-AC1, FR-007-AC3)', () => {
    cy.apiProducts().then((products) => {
      const stand = products.find((p) => p.SKU === SKU);
      const lamp = products.find((p) => p.SKU === 'SKU-1003'); // a valid first line, so a partial reservation would show
      state.before8 = { stand: stand.StockQuantity, lamp: lamp.StockQuantity };
      sql('SELECT ISNULL(MAX(LedgerId), 0) AS MaxLedger, (SELECT MAX(OrderId) FROM Orders) AS MaxOrder FROM InventoryLedger').then((rows) => {
        const { MaxLedger, MaxOrder } = rows[0];
        cy.request({
          method: 'POST',
          url: apiUrl('/orders'),
          failOnStatusCode: false,
          body: {
            customerId: 1,
            address: '14 Main Road, Cape Town',
            couponCode: null,
            items: [
              { productId: lamp.ProductId, quantity: 1 },
              { productId: stand.ProductId, quantity: stand.StockQuantity + 1 },
            ],
          },
        }).then((res) => {
          expect(res.status, 'order above the available stock is rejected').to.be.within(400, 499);
          expect(res.body.message, 'message').to.match(/stock/i);
        });
        // Nothing was reserved, not even for the valid first line
        apiStock().then((s) => expect(s, 'Laptop Stand stock unchanged').to.eq(state.before8.stand));
        apiStock('SKU-1003').then((s) => expect(s, 'Desk Lamp stock unchanged').to.eq(state.before8.lamp));
        sql('SELECT ISNULL(MAX(LedgerId), 0) AS MaxLedger, (SELECT MAX(OrderId) FROM Orders) AS MaxOrder FROM InventoryLedger').then((after) => {
          expect(after[0].MaxLedger, 'no new ledger entries').to.eq(MaxLedger);
          expect(after[0].MaxOrder, 'no new order row').to.eq(MaxOrder);
        });
      });
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 09 [API] Return the first order after delivery -> return accepted (FR-005-AC4)', () => {
    // A return needs a delivered order, so the first order is shipped and delivered first
    cy.apiSetShipmentStatus(state.order1, 'Shipped');
    cy.apiSetShipmentStatus(state.order1, 'Delivered');
    cy.request({
      method: 'POST',
      url: apiUrl('/returns'),
      failOnStatusCode: false,
      body: { orderId: state.order1, reason: 'E2E inventory return' },
    }).then((res) => {
      expect(res.status, 'return accepted').to.eq(201);
      state.ret = res.body;
    });
  });

  // BLOCKED: returns cover the whole order (no per-item quantity) and there is no "mark received" step
  it.skip('Step 09b [API] Return quantity 1 only and mark the return received (FR-005-AC4) - BLOCKED: no partial return and no receive step', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 10 [SQL] Stock = S0 - 2 after the return (FR-005-AC4, FR-007-AC2)', () => {
    dbStock().then((stock) => expect(stock, 'Products.StockQuantity after the return').to.eq(state.s0 - 2));
  });

  it('Step 10b [SQL] The ledger has a Return entry of +1 for the first order (FR-005-AC4, FR-007-AC2)', () => {
    sql('SELECT ChangeQuantity, Reason FROM InventoryLedger WHERE OrderId = @orderId AND ChangeQuantity > 0', {
      orderId: state.order1,
    }).then((rows) => {
      expect(rows, 'return entries in the ledger').to.have.length(1);
      expect(rows[0].ChangeQuantity, 'returned quantity in the ledger').to.eq(1);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 11 [UI] The displayed availability for the SKU = S0 - 2 (FR-007-AC1)', () => {
    cy.loginAs('customer1');
    create.visit();
    create.stockOf(NAME).then((shown) => {
      state.uiFinal = shown;
      expect(shown, 'availability shown after the return').to.eq(state.s0 - 2);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 12 [SQL] Reconciliation (S0 + ledger = current stock), no negative stock, UI = API = DB (FR-007-AC3, FR-007-AC4)', () => {
    sql(
      `SELECT p.StockQuantity AS Stock,
              (SELECT ISNULL(SUM(ChangeQuantity), 0) FROM InventoryLedger WHERE ProductId = p.ProductId AND LedgerId > @base) AS LedgerSince
       FROM Products p WHERE p.SKU = @sku`,
      { sku: SKU, base: state.ledgerBase },
    ).then((rows) => {
      const { Stock, LedgerSince } = rows[0];
      apiStock().then((api) => {
        const report = { test: 'T-E2E-INV-001', sku: SKU, openingS0: state.s0, ledgerSinceBaseline: LedgerSince, expected: state.s0 + LedgerSince, db: Stock, api, ui: state.uiFinal };
        cy.writeFile('reports/e2e/T-E2E-INV-001-reconciliation.json', report);
        expect(state.s0 + LedgerSince, 'opening + ledger = current stock').to.eq(Stock);
        expect(api, 'API stock = DB stock').to.eq(Stock);
        expect(state.uiFinal, 'UI availability = DB stock').to.eq(Stock);
      });
    });
    sql('SELECT ProductId FROM Products WHERE StockQuantity < 0').then((rows) => {
      expect(rows, 'products with negative stock').to.be.empty;
    });
  });
});
