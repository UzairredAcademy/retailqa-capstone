// FR-002 Order Management - P0
import { checkOrderTotals } from '../../support/flows';

describe('Order Management', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-002-AC2
  it('T-UI-ORD-003: Order total equals items x price + tax', () => {
    checkOrderTotals();
  });
});
