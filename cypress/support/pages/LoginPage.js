/**
 * Page Object for the login page.
 * Selectors are placeholders (data-test attributes) - confirm them against the real application.
 */
export class LoginPage {
  selectors = {
    email: '[data-test="email"]',
    password: '[data-test="password"]',
    submit: '[data-test="login-submit"]',
    error: '[data-test="login-error"]',
  };

  visit() {
    cy.visit('/login');
    return this;
  }

  login(email, password) {
    cy.get(this.selectors.email).clear().type(email);
    cy.get(this.selectors.password).clear().type(password, { log: false });
    cy.get(this.selectors.submit).click();
    return this;
  }

  errorMessage() {
    return cy.get(this.selectors.error);
  }
}