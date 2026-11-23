// FR-001 User Authentication & Session Management - P0
import { LoginPage } from '../../support/pages/LoginPage';
import { credentials } from '../../support/utils';

const login = new LoginPage();

describe('User Authentication', () => {
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
});
