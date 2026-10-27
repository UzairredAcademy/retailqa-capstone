// FR-004 Shipment & Delivery Tracking - P0
import { OrderDetailPage } from '../../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Delivery Tracking', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-004-AC5
  it.skip('T-UI-DEL-006: Proof of delivery is visible on a delivered order [BLOCKED - the UI shows no proof of delivery]', () => {
    // Arrange: cy.apiCreateDeliveredOrder(); Act: open the order details
    // Assert: proof of delivery (recipient/signature reference and timestamp) is displayed.
    // A delivered order only shows "Tracking: <number> / Delivered" - no POD and no delivered date.
    // The data model only holds Shipments.DeliveredAt, so confirm with the facilitator what POD means here.
  });
});
