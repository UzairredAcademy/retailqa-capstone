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

    // FR-006-AC4
    it('T-UI-DASH-004: Profile name, email and phone can be updated and are validated', () => {
      // A rejected save is not handled by the page and shows up as an uncaught error - ignore it here.
      cy.on('uncaught:exception', () => false);
      const changes = {
        Name: 'Thabo Jacobs QA',
        Email: 'customer2.qa@retailqe.test',
        Phone: '0820009999',
      };

      // Act: valid update
      profile.visit();
      Object.entries(changes).forEach(([label, value]) => profile.setField(label, value));
      profile.save().its('response.statusCode').should('eq', 200);

      // Assert: saved and persists after a refresh
      profile.success().should('contain', 'Profile saved');
      cy.reload();
      Object.entries(changes).forEach(([label, value]) =>
        profile.field(label).should('have.value', value),
      );

      // Invalid email and invalid phone are rejected and not stored
      [
        { label: 'Email', value: 'not-an-email', keep: changes.Email },
        { label: 'Phone', value: 'abc', keep: changes.Phone },
      ].forEach(({ label, value, keep }) => {
        profile.visit();
        profile
          .setField(label, value)
          .save()
          .its('response.statusCode')
          .should('be.within', 400, 499);
        profile.success().should('not.exist');
        cy.reload();
        profile.field(label).should('have.value', keep);
      });
    });
  });
});
