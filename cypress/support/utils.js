import users from '../fixtures/users.json';

/** Business rules from the resource pack (BUSINESS_RULES_QUICK_REFERENCE.md). */
export const TAX_RATE = 0.15;
export const COUPON_RATE = 0.1;
export const MINUTE = 60 * 1000;

/** Round to 2 decimals the way currency is displayed. */
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** First "R 123.45" amount found in a piece of text (NaN when none). */
export const money = (text) => {
  const m = /R\s(\d+(?:\.\d+)?)/.exec(String(text));
  return m ? Number(m[1]) : Number.NaN;
};

/** Parse "Subtotal R x | Tax R x | Discount R x | Total R x" from the order details page. */
export const parseTotals = (text) => {
  const grab = (label) => {
    const m = new RegExp(`${label}\\s*R\\s*(\\d+(?:\\.\\d+)?)`).exec(text);
    return m ? Number(m[1]) : Number.NaN;
  };
  return {
    subtotal: grab('Subtotal'),
    tax: grab('Tax'),
    discount: grab('Discount'),
    total: grab('Total'),
  };
};

/** Login details for a fixture user. Passwords come from cypress.env.json (git-ignored). */
export const credentials = (key) => {
  const user = users[key];
  if (!user) throw new Error(`Unknown user "${key}" - see cypress/fixtures/users.json`);
  const passwordKey = `${key}Password`;
  return cy.env([passwordKey]).then((env) => {
    const password = env[passwordKey];
    if (!password) {
      throw new Error(
        `Missing Cypress env "${passwordKey}". Copy cypress.env.example.json to cypress.env.json and fill it in.`,
      );
    }
    return { email: user.email, password };
  });
};

export const apiUrl = (path) => `${Cypress.expose('apiUrl')}${path}`;

/**
 * Orders created by a test are remembered here so the global afterEach (support/e2e.js) can cancel the
 * unpaid ones and put the stock back. Stored in Cypress.expose because the support file and each spec are
 * bundled separately and would not share module state.
 */
export const trackOrder = (orderId) => {
  const list = Cypress.expose('trackedOrders') || [];
  Cypress.expose('trackedOrders', [...list, Number(orderId)]);
};
export const drainTrackedOrders = () => {
  const list = Cypress.expose('trackedOrders') || [];
  Cypress.expose('trackedOrders', []);
  return list;
};
