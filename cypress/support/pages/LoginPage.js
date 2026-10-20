/** Page object for the login page (/login). Locators are the app's data-testid attributes. */
const sel = {
  email: '[data-testid="email"]',
  password: '[data-testid="password"]',
  submit: '[data-testid="login-button"]',
  error: '[data-testid="login-error"]',
};

export class LoginPage {
  visit() {
    cy.visit('/login');
    cy.get(sel.email).should('be.visible');
    return this;
  }

  /** The form is pre-filled by the app, so each field is cleared first. An empty value leaves it empty. */
  fill(selector, value, { log = true } = {}) {
    cy.get(selector).clear();
    if (value) cy.get(selector).type(value, { log });
    return this;
  }

  submit() {
    cy.get(sel.submit).click();
    return this;
  }

  loginWith(email, password) {
    this.fill(sel.email, email);
    this.fill(sel.password, password, { log: false });
    return this.submit();
  }

  error() {
    return cy.get(sel.error);
  }
}
