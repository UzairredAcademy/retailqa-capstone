import { LoginPage } from './pages/LoginPage';
import { apiUrl, credentials, trackOrder } from './utils';
import cards from '../fixtures/cards.json';

const loginPage = new LoginPage();

/**
 * Log in through the UI once and reuse the session for later tests (cy.session).
 * Leaves the browser on /dashboard.
 * @param {string} userKey customer1 | customer2 | admin (cypress/fixtures/users.json)
 */
Cypress.Commands.add('loginAs', (userKey) => {
  const { email, password } = credentials(userKey);
  cy.session(
    ['ui-login', userKey],
    () => {
      loginPage.visit().loginWith(email, password);
      cy.location('pathname').should('eq', '/dashboard');
    },
    {
      // The app expires sessions after 30 minutes, so check the restored session is still valid.
      validate() {
        cy.visit('/dashboard');
        cy.contains('h1', 'Dashboard').should('be.visible');
      },
    },
  );
  cy.visit('/dashboard');
});

// ------------------------------------------------------------------------------------------
// API arrange helpers - used to set up data quickly; the behaviour under test is driven in the UI.
// ------------------------------------------------------------------------------------------

Cypress.Commands.add('apiProducts', () => cy.request(apiUrl('/products')).its('body'));

/** Create an order through the API and yield the order body (OrderId, Total, ...). Tracked for clean-up. */
Cypress.Commands.add(
  'apiCreateOrder',
  ({
    sku = 'SKU-1005',
    quantity = 1,
    items,
    couponCode = null,
    address = '14 Main Road, Cape Town',
    customerId = 1,
    track = true,
  } = {}) =>
    cy.apiProducts().then((products) => {
      const lines = (items || [{ sku, quantity }]).map((i) => {
        const product = products.find((p) => p.SKU === i.sku);
        expect(product, `product ${i.sku} exists`).to.not.equal(undefined);
        return { productId: product.ProductId, quantity: i.quantity };
      });
      return cy
        .request({
          method: 'POST',
          url: apiUrl('/orders'),
          body: { customerId, address, couponCode, items: lines },
        })
        .then((res) => {
          expect(res.status, 'order created').to.eq(201);
          if (track) trackOrder(res.body.OrderId);
          return res.body;
        });
    }),
);

Cypress.Commands.add('apiGetOrder', (orderId) =>
  cy.request(apiUrl(`/orders/${orderId}`)).its('body'),
);

/** Pay with the approved test card (or another card) - yields the raw response. */
Cypress.Commands.add('apiPay', (orderId, card = cards.approved) =>
  cy.request({
    method: 'POST',
    url: apiUrl('/payments'),
    failOnStatusCode: false,
    body: { orderId, cardNumber: card.number, expiry: card.expiry, cvv: card.cvv },
  }),
);

Cypress.Commands.add('apiSetShipmentStatus', (orderId, status) =>
  cy.apiGetOrder(orderId).then((order) => {
    expect(order.shipment, `shipment exists for order ${orderId}`).to.be.an('object');
    return cy
      .request({
        method: 'PUT',
        url: apiUrl(`/shipments/${order.shipment.ShipmentId}/status`),
        body: { status },
      })
      .its('status')
      .should('eq', 200);
  }),
);

/** Create + pay an order; yields the order id. */
Cypress.Commands.add('apiCreatePaidOrder', (opts = {}) =>
  cy.apiCreateOrder(opts).then((order) =>
    cy.apiPay(order.OrderId).then((res) => {
      expect(res.status, 'payment accepted').to.eq(201);
      return order.OrderId;
    }),
  ),
);

/** Create + pay + ship an order; yields the order id. */
Cypress.Commands.add('apiCreateShippedOrder', (opts = {}) =>
  cy.apiCreatePaidOrder(opts).then((id) => cy.apiSetShipmentStatus(id, 'Shipped').then(() => id)),
);

/** Create + pay + ship + deliver an order; yields the order id. */
Cypress.Commands.add('apiCreateDeliveredOrder', (opts = {}) =>
  cy
    .apiCreateShippedOrder(opts)
    .then((id) => cy.apiSetShipmentStatus(id, 'Delivered').then(() => id)),
);
