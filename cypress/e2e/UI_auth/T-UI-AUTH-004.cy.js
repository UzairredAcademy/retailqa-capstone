// FR-001 User Authentication & Session Management - P0
import { LoginPage } from '../../support/pages/LoginPage';
import { Nav } from '../../support/pages/Nav';
import { credentials, MINUTE } from '../../support/utils';

const login = new LoginPage();
const nav = new Nav();

describe('User Authentication', () => {
  // FR-001-AC4
  it('T-UI-AUTH-004: Session expires after 30 minutes of inactivity', () => {
    // Arrange: fake only the clock (Date) so the 30 minutes can be skipped; network and timers stay real.
    const { email, password } = credentials('customer1');
    cy.clock(Date.now(), ['Date']);
    login.visit().loginWith(email, password);
    cy.location('pathname').should('eq', '/dashboard');

    // Act + Assert: 29 minutes later the session is still valid
    cy.tick(29 * MINUTE);
    nav.orders().click();
    cy.location('pathname').should('eq', '/orders');
    cy.contains('h1', 'Orders').should('be.visible');
    nav.auth().should('have.text', 'Sign out');

    // Act + Assert: a further 2 minutes without activity -> expired, protected page not available
    cy.tick(2 * MINUTE);
    nav.dashboard().click();
    cy.contains('Please login.').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('retailqeToken'), 'token removed on expiry').to.equal(null);
    });
    cy.reload();
    nav.auth().should('have.text', 'Login');
  });
});
