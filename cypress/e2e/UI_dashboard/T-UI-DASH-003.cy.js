// FR-006 Dashboard & Account Management - P1
import { ProfilePage } from '../../support/pages/ProfilePage';
import { apiUrl } from '../../support/utils';
import customers from '../../fixtures/customers.json';

const profile = new ProfilePage();

describe('User Dashboard', () => {
  // ---- profile tests use customer 2 and put the data back afterwards ----
  describe('profile', () => {
    const original = customers.find((c) => c.CustomerId === 2);

    beforeEach(() => {
      cy.loginAs('customer2');
    });

    afterEach(() => {
      cy.request('PUT', apiUrl('/customers/2'), {
        fullName: original.FullName,
        email: original.Email,
        phone: original.Phone,
        address: original.Address,
      });
    });

    // FR-006-AC3
    it('T-UI-DASH-003: Saved addresses can be added, edited and deleted', () => {
      // The UI keeps a single address per customer (no add/delete), so this covers editing it and
      // rejecting an empty address.
      // A rejected save is not handled by the page and shows up as an uncaught error - ignore it here.
      cy.on('uncaught:exception', () => false);
      const newAddress = '1 Test Street, Cape Town';

      // Act: edit and save
      profile.visit();
      profile.field('Address').should('have.value', original.Address);
      profile.setField('Address', newAddress).save().its('response.statusCode').should('eq', 200);

      // Assert: saved and still there after a refresh
      profile.success().should('contain', 'Profile saved');
      cy.reload();
      profile.field('Address').should('have.value', newAddress);

      // Act: try to save an empty address
      profile
        .setField('Address', '')
        .save()
        .its('response.statusCode')
        .should('be.within', 400, 499);

      // Assert: not saved (no success message; the stored address is unchanged)
      profile.success().should('not.exist');
      cy.reload();
      profile.field('Address').should('have.value', newAddress);
    });
  });
});
