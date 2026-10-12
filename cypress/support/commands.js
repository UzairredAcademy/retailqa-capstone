// Custom Cypress commands. Keep selectors in page objects (cypress/support/pages), not here.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Log in through the UI using a user from fixtures/users.json. */
      loginAs(userKey: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAs', (userKey: string) => {
  cy.fixture('users').then((users: Record<string, { email: string; password: string }>) => {
    const user = users[userKey];
    cy.visit('/login');
    cy.get('[data-test="email"]').type(user.email);
    cy.get('[data-test="password"]').type(user.password, { log: false });
    cy.get('[data-test="login-submit"]').click();
  });
});

export {};
