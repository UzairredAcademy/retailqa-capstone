// FR-004 Shipment & Delivery Tracking - P0
import { OrderDetailPage } from '../support/pages/OrderDetailPage';

const order = new OrderDetailPage();

describe('Delivery Tracking', () => {
  beforeEach(() => {
    cy.loginAs('customer1');
  });

  // FR-004-AC2
  it('T-UI-DEL-001: Tracking number is assigned and visible on the order details page', () => {
    // Arrange: a paid order
    cy.apiCreatePaidOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);

      // Assert: a tracking number is shown and equals the one held by the API
      order.tracking().then(({ number, status }) => {
        expect(number, 'tracking number').to.match(/\S+/);
        expect(status, 'new shipment status').to.eq('Preparing');
        cy.apiGetOrder(id).its('shipment.TrackingNumber').should('eq', number);
      });
    });
  });

  // FR-004-AC1, FR-004-AC3
  it('T-UI-DEL-002: Shipped status is displayed correctly', () => {
    cy.apiCreatePaidOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Arrange + Assert: freshly paid -> Preparing
      order.visit(id);
      order.tracking().its('status').should('eq', 'Preparing');

      // Act: move the shipment to Shipped
      order.markShipped();

      // Assert
      order.success().should('contain', 'Shipment updated');
      order.tracking().its('status').should('eq', 'Shipped');
      cy.apiGetOrder(id).its('shipment.Status').should('eq', 'Shipped');
      // The UI shows no timestamp or status timeline (planned expectation) - only the status text.
    });
  });

  // FR-004-AC3
  it('T-UI-DEL-003: Delivered status is displayed after the shipment is delivered', () => {
    // Arrange: paid order, shipment moved to Shipped then Delivered through the API
    cy.apiCreateDeliveredOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      // Act
      order.visit(id);

      // Assert
      order.tracking().its('status').should('eq', 'Delivered');
      cy.apiGetOrder(id).its('shipment.DeliveredAt').should('not.be.null');
    });
  });

  // FR-004-AC1
  it('T-UI-DEL-004: Unpaid order shows no shipment or tracking number', () => {
    // Arrange
    cy.apiCreateOrder({ sku: 'SKU-1005', quantity: 1 })
      .its('OrderId')
      .then((id) => {
        // Act
        order.visit(id);

        // Assert
        order.status().should('eq', 'Created');
        cy.contains('p', 'Tracking:').should('not.exist');
        cy.contains('button', 'Mark Shipped').should('not.exist');
        cy.apiGetOrder(id).should((body) => {
          expect(body.shipment, 'no shipment before payment').to.not.exist;
        });
      });
  });

  // FR-004-AC2
  it('T-UI-DEL-005: Tracking page finds a shipment by tracking number and handles unknown numbers', () => {
    // The UI has no tracking-by-number page: tracking is shown on each order's details page, so this
    // test checks that, and that an order that does not exist produces a clear message instead.
    cy.apiCreatePaidOrder({ sku: 'SKU-1001', quantity: 1 }).then((id) => {
      order.visit(id);
      order.trackingLine().should('be.visible');

      // Unknown order -> clear error, no tracking data, no blank/crashed page
      cy.visit('/orders/99999999');
      cy.contains('h1', 'Order #99999999').should('be.visible');
      order.error().should('be.visible').invoke('text').should('not.be.empty');
      cy.contains('p', 'Tracking:').should('not.exist');
    });
  });

  // FR-004-AC5
  it.skip('T-UI-DEL-006: Proof of delivery is visible on a delivered order [BLOCKED - the UI shows no proof of delivery]', () => {
    // Arrange: cy.apiCreateDeliveredOrder(); Act: open the order details
    // Assert: proof of delivery (recipient/signature reference and timestamp) is displayed.
    // A delivered order only shows "Tracking: <number> / Delivered" - no POD and no delivered date.
    // The data model only holds Shipments.DeliveredAt, so confirm with the facilitator what POD means here.
  });
});
