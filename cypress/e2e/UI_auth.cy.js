// FR-001 User Authentication & Session Management - P0
import { LoginPage } from '../support/pages/LoginPage';
import { Nav } from '../support/pages/Nav';
import { credentials, MINUTE } from '../support/utils';
import { loginAndCheckSession } from '../support/flows';

const login = new LoginPage();
const nav = new Nav();

describe('User Authentication', () => {
  // FR-001-AC1
  it('T-UI-AUTH-001: User login with valid email and password succeeds', () => {
    // Arrange
    const { email, password } = credentials('customer1');

    // Act
    login.visit().loginWith(email, password);

    // Assert
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('h1', 'Customer Dashboard').should('be.visible');
    nav.auth().should('have.text', 'Sign out');
    [nav.dashboard(), nav.orders(), nav.createOrder(), nav.profile()].forEach((link) =>
      link.should('be.visible'),
    );
    cy.window().then((win) => {
      expect(win.localStorage.getItem('retailqeToken'), 'session token').to.be.a('string').and.not
        .be.empty;
    });
  });

  // FR-001-AC2
  it('T-UI-AUTH-002: Login with invalid credentials is rejected with a clear error message', () => {
    // Arrange
    const valid = credentials('customer1');
    const messages = {};
    const attempt = (label, email, password) => {
      // Act
      login.visit().loginWith(email, password);
      // Assert
      login
        .error()
        .should('be.visible')
        .invoke('text')
        .then((text) => {
          expect(text.trim(), `${label}: error message`).to.not.be.empty;
          messages[label] = text.trim();
        });
      cy.location('pathname').should('not.eq', '/dashboard');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('retailqeToken'), `${label}: no session`).to.equal(null);
      });
    };

    attempt('wrong password', valid.email, 'Wrong-Password-1!');
    attempt('unknown email', 'unknown@retailqe.test', valid.password);
    attempt('empty password', valid.email, '');

    // The message must not reveal which field was wrong: same text for wrong password and unknown email.
    cy.then(() => {
      expect(messages['unknown email'], 'same message for unknown email and wrong password').to.eq(
        messages['wrong password'],
      );
    });
  });

  // FR-001-AC3
  it('T-UI-AUTH-003: Session persists across page navigation', () => {
    // Arrange + Act + Assert (log in, navigate every main page, refresh each one)
    loginAndCheckSession('customer1');
  });

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
