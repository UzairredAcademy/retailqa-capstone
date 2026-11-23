// P1 | T-E2E-ADR-001: Address change before delivery
// Expected: the address can be changed before payment only; the final address is consistent across UI, API, DB and the shipment.
import { CreateOrderPage } from '../../support/pages/CreateOrderPage';
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';
import { ProfilePage } from '../../support/pages/ProfilePage';
import { apiUrl } from '../../support/utils';
import cards from '../../fixtures/cards.json';

const create = new CreateOrderPage();
const order = new OrderDetailPage();
const profile = new ProfilePage();

const ADDRESS_A = '14 Main Road, Cape Town'; // customer1's current address
const ADDRESS_B = '77 Bree Street, Cape Town'; // the new address
const ADDRESS_C = '1 Rejected Road, Cape Town'; // used after payment - must be refused

// Values carried from one step to the next
const state = {};

// Run a SQL query through the cy.task('sql') defined in cypress.config.js
const sql = (query, params = {}) => cy.task('sql', { query, params });
const near = (a, b, msg) => expect(Number(a), msg).to.be.closeTo(Number(b), 0.005);
const deliveryInput = () => cy.contains('label', 'Delivery address').find('input');

describe('T-E2E-ADR-001: Address change before delivery', { retries: 0 }, () => {
  before(() => {
    // Stop the global afterEach in support/e2e.js from cancelling our order between steps
    Cypress.env('keepData', true);
  });

  beforeEach(function () {
    // Steps 4-12 need the order created in Step 3
    if (!/^Step 0[1-3]\b/.test(this.currentTest.title) && !state.orderId) this.skip();
  });

  after(() => {
    Cypress.env('keepData', false);
    // Put the customer's profile address back
    if (state.origProfile) {
      const p = state.origProfile;
      cy.request({
        method: 'PUT',
        url: apiUrl('/customers/1'),
        body: { fullName: p.FullName, email: p.Email, phone: p.Phone, address: p.Address },
      });
    }
    // If the run stopped before payment, cancel the unpaid order so the stock goes back
    if (state.orderId && !state.paid) {
      cy.request({ method: 'POST', url: apiUrl(`/orders/${state.orderId}/cancel`), failOnStatusCode: false });
    }
  });

  // -----------------------------------------------------------------------------------------
  it('Step 01 [UI] Log in and save a new address (Address B) -> Address B appears on the profile (FR-001-AC1, FR-006-AC3)', () => {
    // This system has one saved address per customer (the profile address), not a list of saved addresses
    cy.request(apiUrl('/customers/1')).its('body').then((p) => {
      state.origProfile = p;
    });
    cy.loginAs('customer1');
    profile.visit();
    profile.setField('Address', ADDRESS_B);
    profile.save().its('response.statusCode').should('eq', 200);
    profile.success().should('contain', 'Profile saved');
    profile.field('Address').should('have.value', ADDRESS_B);
  });

  // -----------------------------------------------------------------------------------------
  it('Step 02 [API] GET the saved address -> Address B is returned and equals the UI value (FR-007-AC1)', () => {
    cy.request(apiUrl('/customers/1')).its('body.Address').should('eq', ADDRESS_B);
  });

  // -----------------------------------------------------------------------------------------
  it('Step 03 [UI] Create an order delivering to Address A -> order created with Address A (FR-002-AC1)', () => {
    cy.loginAs('customer1');
    create.visit();
    create.setQuantity('Laptop Stand', 1);
    create.setAddress(ADDRESS_A);
    deliveryInput().should('have.value', ADDRESS_A);
    create.submit();
    create.success().should('contain', 'Order #');
    create.createdOrderId().then((id) => {
      state.orderId = id;
      cy.log(`Order id for this run: ${id}`);
    });
    // The order page does not display the address, so it is confirmed through the API
    cy.then(() => cy.apiGetOrder(state.orderId)).then((o) => {
      expect(o.Address, 'delivery address on the new order').to.eq(ADDRESS_A);
      state.total = Number(o.Total);
    });
  });

  // -----------------------------------------------------------------------------------------
  // BLOCKED: neither the order page nor the create-order page can show or change an existing order's address
  it.skip('Step 04 [UI] Change the order delivery address to B before paying -> order summary shows Address B (FR-002-AC4) - BLOCKED: no change-address control in the UI', () => {});

  it('Step 04b [API] Change the order delivery address to B before paying (the UI has no control for this)', () => {
    cy.request({ method: 'PUT', url: apiUrl(`/orders/${state.orderId}`), body: { address: ADDRESS_B } }).then((res) => {
      expect(res.status, 'address change before payment is accepted').to.eq(200);
      expect(res.body.Address, 'address in the response').to.eq(ADDRESS_B);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 05 [API] GET the order -> delivery address is B and nothing else changed (FR-007-AC1)', () => {
    cy.apiGetOrder(state.orderId).then((o) => {
      expect(o.Address, 'delivery address').to.eq(ADDRESS_B);
      expect(o.Status, 'order status').to.eq('Created');
      near(o.Total, state.total, 'total unchanged by the address change');
      expect(o.items, 'order lines unchanged').to.have.length(1);
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 06 [UI] Pay with a valid card -> order Paid (FR-003-AC2)', () => {
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
  it('Step 07 [SQL] Order address = B and the payment is approved (FR-007-AC2)', () => {
    sql(
      `SELECT o.Address, o.Status,
              (SELECT COUNT(*) FROM Payments WHERE OrderId = o.OrderId AND Status = 'Approved') AS ApprovedPayments
       FROM Orders o WHERE o.OrderId = @orderId`,
      { orderId: state.orderId },
    ).then((rows) => {
      expect(rows, 'order row').to.have.length(1);
      expect(rows[0].Address, 'Orders.Address').to.eq(ADDRESS_B);
      expect(rows[0].Status, 'Orders.Status').to.eq('Paid');
      expect(rows[0].ApprovedPayments, 'approved payments (this system uses Approved, not Settled)').to.eq(1);
    });
  });

  // -----------------------------------------------------------------------------------------
  // BLOCKED: there is no way to attempt an address change from the UI at all
  it.skip('Step 08 [UI] Try to change the address after payment -> change is blocked with a message (FR-002-AC5) - BLOCKED: no change-address control in the UI', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 09 [API] PUT a new address on the paid order -> rejected and the address remains B (FR-002-AC5)', () => {
    cy.request({
      method: 'PUT',
      url: apiUrl(`/orders/${state.orderId}`),
      failOnStatusCode: false,
      body: { address: ADDRESS_C },
    }).then((res) => {
      expect(res.status, 'change on a paid order is rejected').to.be.oneOf([403, 409, 422]);
      expect(res.body.message, 'message explaining the refusal').to.match(/paid|modif/i);
    });
    cy.apiGetOrder(state.orderId).its('Address').should('eq', ADDRESS_B);
  });

  // -----------------------------------------------------------------------------------------
  it('Step 10 [API] GET the shipment -> created with a tracking number, delivering to Address B (FR-004-AC1, FR-004-AC2)', () => {
    cy.request(apiUrl(`/shipments/order/${state.orderId}`)).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.TrackingNumber, 'tracking number').to.match(/^TRK-\d{6}$/);
      expect(res.body.Status, 'new shipment status').to.eq('Preparing');
      state.shipmentId = res.body.ShipmentId;
      state.tracking = res.body.TrackingNumber;
    });
    // A shipment has no address of its own; it delivers to the address on its order
    cy.apiGetOrder(state.orderId).its('Address').should('eq', ADDRESS_B);
  });

  // BLOCKED: the Shipments table and the shipment API have no destination address field
  it.skip('Step 10b [API] The shipment itself carries destination Address B (FR-004-AC1) - BLOCKED: shipments have no destination field', () => {});

  // -----------------------------------------------------------------------------------------
  it('Step 11 [SQL] Shipment exists for the order and its destination (the order address) = B (FR-007-AC2)', () => {
    sql(
      `SELECT s.ShipmentId, s.TrackingNumber, o.Address
       FROM Shipments s JOIN Orders o ON o.OrderId = s.OrderId
       WHERE s.OrderId = @orderId`,
      { orderId: state.orderId },
    ).then((rows) => {
      expect(rows, 'one shipment for the order').to.have.length(1);
      expect(rows[0].TrackingNumber, 'tracking number = API').to.eq(state.tracking);
      expect(rows[0].Address, 'destination address').to.eq(ADDRESS_B);
    });
  });

  it('Step 11b [SQL] The pre-payment address change is audited (FR-007-AC2)', () => {
    sql(
      `SELECT Action, Details FROM AuditLog
       WHERE EntityType = 'Order' AND EntityId = @orderId
         AND (Action LIKE '%ddress%' OR Details LIKE '%ddress%' OR Action LIKE '%Updat%' OR Action LIKE '%Modif%')`,
      { orderId: state.orderId },
    ).then((rows) => {
      expect(rows, 'an AuditLog entry for the address change').to.not.be.empty;
    });
  });

  // -----------------------------------------------------------------------------------------
  it('Step 12 [UI] Open the order page -> tracking number and status shown match the API and DB (FR-004-AC3, FR-007-AC1)', () => {
    cy.loginAs('customer1');
    order.visit(state.orderId);
    order.tracking().then(({ number, status }) => {
      expect(number, 'tracking number on the page').to.eq(state.tracking);
      expect(status, 'shipment status on the page').to.eq('Preparing');
    });
  });

  // BLOCKED: there is no tracking page and no page shows the delivery address
  it.skip('Step 12b [UI] Delivery address shown on the tracking page matches the API and DB (FR-004-AC3) - BLOCKED: the UI never displays the delivery address', () => {});
});
