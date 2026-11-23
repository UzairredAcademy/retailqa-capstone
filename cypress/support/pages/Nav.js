/** Page object for the primary navigation header (present on every page). */
const sel = {
  dashboard: '[data-testid="nav-dashboard"]',
  orders: '[data-testid="nav-orders"]',
  createOrder: '[data-testid="nav-create-order"]',
  profile: '[data-testid="nav-profile"]',
  auth: '[data-testid="nav-auth"]',
};

export class Nav {
  dashboard() {
    return cy.get(sel.dashboard);
  }

  orders() {
    return cy.get(sel.orders);
  }

  createOrder() {
    return cy.get(sel.createOrder);
  }

  profile() {
    return cy.get(sel.profile);
  }

  /** "Login" when signed out, "Sign out" when signed in. */
  auth() {
    return cy.get(sel.auth);
  }
}
