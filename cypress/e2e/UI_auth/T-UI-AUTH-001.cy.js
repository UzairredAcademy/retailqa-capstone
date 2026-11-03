// FR-001 User Authentication & Session Management - P0
import { LoginPage } from '../../support/pages/LoginPage';
import { Nav } from '../../support/pages/Nav';
import { credentials } from '../../support/utils';

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
});
