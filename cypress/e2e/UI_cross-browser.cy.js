// Cross-Browser Support - P2
// Run each browser in turn:  npm run test:ui:chrome | test:ui:firefox | test:ui:edge
// A test that targets a browser is skipped (pending) in the others. Set CYPRESS_xbrAny=true to run all
// of them in whatever browser is being used.
import { OrderDetailPage } from '../support/pages/OrderDetailPage';
import { Nav } from '../support/pages/Nav';
import { checkOrderTotals, loginAndCheckSession } from '../support/flows';

const order = new OrderDetailPage();
const nav = new Nav();

/** True when the current browser is one of the given names (or xbrAny is set). */
const runsIn = (...names) => Boolean(Cypress.env('xbrAny')) || names.includes(Cypress.browser.name);

describe('Cross-Browser Support', () => {
  // FR-001-AC1, FR-001-AC3
  it('T-UI-XBR-001: Login and session persistence work on Chrome', function () {
    if (!runsIn('chrome', 'chromium')) this.skip();
    cy.log(`Browser: ${Cypress.browser.displayName} ${Cypress.browser.version}`);
    loginAndCheckSession('customer1');
  });

  // FR-001-AC1, FR-001-AC3
  it('T-UI-XBR-002: Login and session persistence work on Firefox', function () {
    if (!runsIn('firefox')) this.skip();
    cy.log(`Browser: ${Cypress.browser.displayName} ${Cypress.browser.version}`);
    loginAndCheckSession('customer1');
  });

  // FR-001-AC1, FR-001-AC3
  it('T-UI-XBR-003: Login and session persistence work on Edge', function () {
    if (!runsIn('edge')) this.skip();
    cy.log(`Browser: ${Cypress.browser.displayName} ${Cypress.browser.version}`);
    loginAndCheckSession('customer1');
  });

  // FR-002-AC2
  it('T-UI-XBR-004: Order total calculation is correct on Firefox', function () {
    if (!runsIn('firefox')) this.skip();
    cy.loginAs('customer1');
    checkOrderTotals();
  });

  // FR-002-AC2
  it('T-UI-XBR-005: Order total calculation is correct on Edge', function () {
    if (!runsIn('edge')) this.skip();
    cy.loginAs('customer1');
    checkOrderTotals();
  });

  // FR-004-AC2, FR-004-AC3
  it('T-UI-XBR-006: Tracking page renders correctly at 1920x1080 and 1366x768', () => {
    cy.loginAs('customer1');
    cy.apiCreateShippedOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      [
        [1920, 1080],
        [1366, 768],
      ].forEach(([width, height]) => {
        // Act
        cy.viewport(width, height);
        order.visit(id);

        // Assert: tracking number and status are visible and not cut off; no sideways scrolling
        order
          .trackingLine()
          .should('be.visible')
          .and(($line) => {
            const el = $line[0];
            expect(el.scrollWidth, `${width}x${height}: tracking line is not clipped`).to.be.lte(
              el.clientWidth + 1,
            );
          });
        order.tracking().its('status').should('eq', 'Shipped');
        nav.auth().should('be.visible');
        cy.document().then((doc) => {
          expect(
            doc.documentElement.scrollWidth,
            `${width}x${height}: no horizontal scrollbar`,
          ).to.be.lte(doc.documentElement.clientWidth + 1);
        });
      });
    });
  });
});
