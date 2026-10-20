/// <reference types="cypress" />

describe('API Authentication Tests', () => {
  const apiBaseUrl = Cypress.env('API_BASE_URL') || 'http://localhost:5000/api';

  // ---------------------------------------------------------------------------
  // Test Case 1: Successful Login with Valid Credentials
  // ---------------------------------------------------------------------------
  it('API-AUTH-01: Should authenticate successfully and return a valid JWT token', () => {
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/auth/login`,
      body: {
        email: 'admin@lewisretail.co.za', // Standard test user credentials
        password: 'Password123!'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Assertions
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
      expect(response.body.token).to.be.a('string').and.not.be.empty;
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('email', 'admin@lewisretail.co.za');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Case 2: Login Failure with Invalid Password
  // ---------------------------------------------------------------------------
  it('API-AUTH-02: Should reject authentication with incorrect password', () => {
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/auth/login`,
      body: {
        email: 'admin@lewisretail.co.za',
        password: 'WrongPassword123!'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Assertions
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.match(/invalid credentials|unauthorized/i);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Case 3: Login Failure with Non-Existent User
  // ---------------------------------------------------------------------------
  it('API-AUTH-03: Should reject authentication for non-existent user email', () => {
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/auth/login`,
      body: {
        email: 'nonexistent.user@lewisretail.co.za',
        password: 'Password123!'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Assertions
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property('error');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Case 4: Validation Error when Sending Missing Required Payload Fields
  // ---------------------------------------------------------------------------
  it('API-AUTH-04: Should return 400 Bad Request when mandatory fields are missing', () => {
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/auth/login`,
      body: {
        email: 'admin@lewisretail.co.za'
        // Missing required 'password' field
      },
      failOnStatusCode: false
    }).then((response) => {
      // Assertions
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('error');
    });
  });
});