// Cross-Browser Support - P2
// Run each browser in turn:  npm run test:ui:chrome | test:ui:firefox | test:ui:edge
// A test that targets a browser is skipped (pending) in the others. Set CYPRESS_xbrAny=true to run all
// of them in whatever browser is being used.
import { loginAndCheckSession } from '../../support/flows';

/** True when the current browser is one of the given names (or xbrAny is set). */
const runsIn = (...names) => Boolean(Cypress.env('xbrAny')) || names.includes(Cypress.browser.name);

describe('Cross-Browser Support', () => {
  // FR-001-AC1, FR-001-AC3
  it('T-UI-XBR-001: Login and session persistence work on Chrome', function () {
    if (!runsIn('chrome', 'chromium')) this.skip();
    cy.log(`Browser: ${Cypress.browser.displayName} ${Cypress.browser.version}`);
    loginAndCheckSession('customer1');
  });
});
