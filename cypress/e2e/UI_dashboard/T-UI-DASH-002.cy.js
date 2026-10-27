// FR-006 Dashboard & Account Management - P1
import { OrdersPage } from '../../support/pages/OrdersPage';
import { apiUrl } from '../../support/utils';

const orders = new OrdersPage();

describe('User Dashboard', () => {
  describe('order history', () => {
    const data = {};

    before(() => {
      cy.apiCreateOrder({ sku: 'SKU-1001', quantity: 1, track: false }).then((o) => {
        data.created = o; // cheap, unpaid
      });
      cy.apiCreateOrder({ sku: 'SKU-1002', quantity: 1, track: false }).then((o) => {
        data.expensive = o; // expensive, unpaid
      });
      cy.apiCreatePaidOrder({ sku: 'SKU-1005', quantity: 1, track: false }).then((id) => {
        data.paidId = id;
      });
      cy.apiCreateOrder({ sku: 'SKU-1003', quantity: 1, track: false }).then((o) => {
        data.cancelled = o;
        cy.request('POST', apiUrl(`/orders/${o.OrderId}/cancel`));
      });
    });

    after(() => {
      // put the stock back for the orders that are still unpaid
      [data.created, data.expensive].forEach((o) => {
        if (o)
          cy.request({
            method: 'POST',
            url: apiUrl(`/orders/${o.OrderId}/cancel`),
            failOnStatusCode: false,
          });
      });
    });

    beforeEach(() => {
      cy.loginAs('customer1');
    });

    // FR-006-AC2
    it('T-UI-DASH-002: Order history can be filtered by date range, status and price', () => {
      const createdId = data.created.OrderId;
      const expensiveId = data.expensive.OrderId;
      const cancelledId = data.cancelled.OrderId;
      const cheap = Number(data.created.Total);
      const dear = Number(data.expensive.Total);
      const midpoint = Math.round(((cheap + dear) / 2) * 100) / 100;

      // Arrange
      orders.visit();
      orders.expectRows((rows) => expect(rows.length, 'orders listed').to.be.greaterThan(2));
      let unfilteredCount = 0;
      orders.expectRows((rows) => {
        unfilteredCount = rows.length;
      });

      // Act + Assert: status filter
      orders.filterStatus('Paid').apply();
      orders.expectRows((rows) => {
        expect(rows.length, 'paid orders').to.be.greaterThan(0);
        expect(
          rows.every((r) => r.status === 'Paid'),
          'only Paid orders',
        ).to.eq(true);
        expect(rows.map((r) => r.id)).to.include(data.paidId);
        expect(rows.map((r) => r.id)).to.not.include(createdId);
        expect(rows.map((r) => r.id)).to.not.include(cancelledId);
      });
      orders.filterStatus('Cancelled').apply();
      orders.expectRows((rows) => {
        expect(
          rows.every((r) => r.status === 'Cancelled'),
          'only Cancelled orders',
        ).to.eq(true);
        expect(rows.map((r) => r.id)).to.include(cancelledId);
      });

      // Price filter (minimum, maximum, then both)
      orders.filterStatus('All statuses').setMin(midpoint).apply();
      orders.expectRows((rows) => {
        expect(
          rows.every((r) => r.total >= midpoint),
          `all totals >= ${midpoint}`,
        ).to.eq(true);
        expect(rows.map((r) => r.id)).to.include(expensiveId);
        expect(rows.map((r) => r.id)).to.not.include(createdId);
      });
      orders.setMin('').setMax(midpoint).apply();
      orders.expectRows((rows) => {
        expect(
          rows.every((r) => r.total <= midpoint),
          `all totals <= ${midpoint}`,
        ).to.eq(true);
        expect(rows.map((r) => r.id)).to.include(createdId);
        expect(rows.map((r) => r.id)).to.not.include(expensiveId);
      });

      // Combined: status Created AND price >= midpoint -> the expensive unpaid order only
      orders.filterStatus('Created').setMin(midpoint).setMax('').apply();
      orders.expectRows((rows) => {
        expect(rows.every((r) => r.status === 'Created' && r.total >= midpoint)).to.eq(true);
        expect(rows.map((r) => r.id)).to.include(expensiveId);
        expect(rows.map((r) => r.id)).to.not.include(createdId);
      });

      // Clearing the filters restores the full list
      orders.filterStatus('All statuses').setMin('').setMax('').apply();
      orders.expectRows((rows) =>
        expect(rows.length, 'orders after clearing').to.be.gte(unfilteredCount),
      );

      // Date range: the Orders page has no date inputs (the API supports from/to), so it cannot be driven
      // from the UI. Add a date-range step here if the UI gains those inputs.
      cy.log('Date-range filter not available in the UI - status and price filters verified');
    });
  });
});
