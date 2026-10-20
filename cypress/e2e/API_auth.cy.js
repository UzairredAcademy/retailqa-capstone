/// <reference types="cypress" />

describe('API Authentication Tests', () => {
  const apiBaseUrl = Cypress.env('API_BASE_URL') || 'http://localhost:4000/api';
  const validEmail = 'customer1@retailqe.test';
  const validPassword = 'Pass123!';

  // ---------------------------------------------------------------------------
  // Test Case 1: Successful Login with Valid Credentials
  // ---------------------------------------------------------------------------
  it('API-AUTH-01: Should authenticate successfully and return a valid JWT token', () => {
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/auth/login`,
      body: {
        email: validEmail,
        password: validPassword,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
      expect(response.body.token).to.be.a('string').and.not.be.empty;
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('email', validEmail);
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
        email: validEmail,
        password: 'WrongPassword123!',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(/invalid credentials|unauthorized/i);
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
        email: 'nonexistent.user@retailqe.test',
        password: validPassword,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(/invalid credentials|unauthorized/i);
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
        email: validEmail,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.match(/email and password are required/i);
    });
  });
});