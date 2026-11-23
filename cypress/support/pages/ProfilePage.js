/** Page object for the customer profile (/profile). Fields are found by their label text. */
export class ProfilePage {
  visit() {
    cy.visit('/profile');
    cy.contains('h1', 'Profile').should('be.visible');
    return this;
  }

  field(label) {
    return cy.contains('label', label).find('input');
  }

  setField(label, value) {
    this.field(label).clear();
    if (value) this.field(label).type(value);
    return this;
  }

  /** Click Save and wait for the update request; yields the intercepted request (use .its('response.statusCode')). */
  save() {
    cy.intercept('PUT', '**/customers/*').as('saveProfile');
    cy.contains('button', 'Save').click();
    return cy.wait('@saveProfile');
  }

  success() {
    return cy.get('.success');
  }
}
