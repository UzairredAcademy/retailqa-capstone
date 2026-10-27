// Cross-Browser Support - P2
// Run each browser in turn:  npm run test:ui:chrome | test:ui:firefox | test:ui:edge
// A test that targets a browser is skipped (pending) in the others. Set CYPRESS_xbrAny=true to run all
// of them in whatever browser is being used.
import { checkOrderTotals } from '../../support/flows';

/** True when the current browser is one of the given names (or xbrAny is set). */
const runsIn = (...names) => Boolean(Cypress.env('xbrAny')) || names.includes(Cypress.browser.name);

describe('Cross-Browser Support', () => {
  // FR-002-AC2
  it('T-UI-XBR-005: Order total calculation is correct on Edge', function () {
    if (!runsIn('edge')) this.skip();
    cy.loginAs('customer1');
    checkOrderTotals();
  });
});
