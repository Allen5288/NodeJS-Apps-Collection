// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom commands for CMS API testing
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Login command that returns the auth token
Cypress.Commands.add('loginApi', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${API_BASE_URL}/login`,
    body: { email, password }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('token');
    return response.body.token;
  });
});

// Register a new user
Cypress.Commands.add('registerApi', (username, email, password) => {
  return cy.request({
    method: 'POST',
    url: `${API_BASE_URL}/register`,
    body: { username, email, password },
    failOnStatusCode: false
  });
});

// Create an article with authentication
Cypress.Commands.add('createArticle', (token, articleData) => {
  return cy.request({
    method: 'POST',
    url: `${API_BASE_URL}/articles`,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: articleData
  });
});

// Get all articles with authentication
Cypress.Commands.add('getArticles', (token) => {
  return cy.request({
    method: 'GET',
    url: `${API_BASE_URL}/articles`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
});

// Delete an article with authentication
Cypress.Commands.add('deleteArticle', (token, articleId) => {
  return cy.request({
    method: 'DELETE',
    url: `${API_BASE_URL}/articles/${articleId}`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
});

// Setup test user and return token
Cypress.Commands.add('setupTestUser', () => {
  const testUser = {
    username: 'cypressuser',
    email: 'cypress@test.com',
    password: 'testpass123'
  };

  return cy.registerApi(testUser.username, testUser.email, testUser.password)
    .then(() => {
      return cy.loginApi(testUser.email, testUser.password);
    })
    .then((token) => {
      return { token, user: testUser };
    });
});