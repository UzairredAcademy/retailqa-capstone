import { CreateOrderPage } from './pages/CreateOrderPage';
import { LoginPage } from './pages/LoginPage';
import { Nav } from './pages/Nav';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { credentials, round2, TAX_RATE } from './utils';

/** Flows shared by the functional specs and the cross-browser specs. */

/** Log in through the UI, then walk the main pages and refresh each one: the session must persist. */
export function loginAndCheckSession(userKey = 'customer1') {
  const login = new LoginPage();
  const nav = new Nav();
  return credentials(userKey).then(({ email, password }) => {
    login.visit().loginWith(email, password);
    cy.location('pathname').should('eq', '/dashboard');
    nav.auth().should('have.text', 'Sign out');

    const pages = [
      [() => nav.orders(), '/orders'],
      [() => nav.createOrder(), '/create-order'],
      [() => nav.profile(), '/profile'],
      [() => nav.dashboard(), '/dashboard'],
    ];
    pages.forEach(([link, path]) => {
      link().click();
      cy.location('pathname').should('eq', path);
      cy.reload();
      cy.location('pathname').should('eq', path);
      nav.auth().should('have.text', 'Sign out');
    });
  });
}

/**
 * Order total = items x price + tax: order 2 x Wireless Mouse + 1 x Desk Lamp (prices read from the
 * product cards) and compare subtotal, tax (15%) and total with an independent calculation.
 * Expects a logged-in customer session.
 */
export function checkOrderTotals() {
  const create = new CreateOrderPage();
  const order = new OrderDetailPage();

  create.visit();
  create.priceOf('Wireless Mouse').then((mouse) => {
    create.priceOf('Desk Lamp').then((lamp) => {
      const subtotal = round2(mouse * 2 + lamp);
      const tax = round2(subtotal * TAX_RATE);
      const total = round2(subtotal + tax);

      create
        .placeOrder({
          items: [
            { name: 'Wireless Mouse', qty: 2 },
            { name: 'Desk Lamp', qty: 1 },
          ],
        })
        .then((id) => {
          create.success().should('contain', `R ${total.toFixed(2)}`);
          order.visit(id);
          order.totals().then((t) => {
            expect(t.subtotal, 'subtotal').to.be.closeTo(subtotal, 0.01);
            expect(t.tax, 'tax (15% of subtotal)').to.be.closeTo(tax, 0.01);
            expect(t.discount, 'discount').to.eq(0);
            expect(t.total, 'total').to.be.closeTo(total, 0.01);
          });
        });
    });
  });
}
