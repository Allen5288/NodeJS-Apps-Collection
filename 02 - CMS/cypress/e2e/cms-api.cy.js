describe('CMS API End-to-End Tests', () => {
  const baseUrl = 'http://localhost:5000/api/v1';
  const testUser = {
    username: 'e2euser',
    email: 'e2etest@example.com',
    password: 'testpass123'
  };
  
  let authToken = '';
  let createdArticleId = '';

  before(() => {
    // Start the server (ensure your server is running on port 5000)
    // You might need to start it manually: npm run dev
  });

  beforeEach(() => {
    // Set common request headers
    cy.intercept('**', (req) => {
      req.headers['Content-Type'] = 'application/json';
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new user successfully', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/register`,
        body: testUser,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([201, 400]); // 400 if user already exists
        if (response.status === 201) {
          expect(response.body).to.have.property('message');
          expect(response.body.message).to.include('registered successfully');
        }
      });
    });

    it('should login with valid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/login`,
        body: {
          email: testUser.email,
          password: testUser.password
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('token');
        expect(response.body).to.have.property('user');
        expect(response.body.user.email).to.eq(testUser.email);
        
        // Store token for subsequent requests
        authToken = response.body.token;
      });
    });

    it('should fail login with invalid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/login`,
        body: {
          email: testUser.email,
          password: 'wrongpassword'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('error');
      });
    });

    it('should get user profile when authenticated', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/user/me`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.email).to.eq(testUser.email);
        expect(response.body.username).to.eq(testUser.username);
      });
    });
  });

  describe('Articles Management', () => {
    it('should not get articles without authentication', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/articles`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('error');
      });
    });

    it('should get articles when authenticated', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/articles`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
      });
    });

    it('should create a new article', () => {
      const newArticle = {
        title: 'E2E Test Article',
        content: 'This is a test article created by Cypress E2E test',
        author: testUser.username,
        category: 'Technology'
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/articles`,
        body: newArticle,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 201]);
        expect(response.body).to.have.property('title', newArticle.title);
        expect(response.body).to.have.property('content', newArticle.content);
        
        // Store article ID for subsequent tests
        createdArticleId = response.body._id || response.body.id;
        expect(createdArticleId).to.exist;
      });
    });

    it('should get a specific article by ID', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/articles/${createdArticleId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('title', 'E2E Test Article');
        expect(response.body).to.have.property('content');
        expect(response.body._id || response.body.id).to.eq(createdArticleId);
      });
    });

    it('should update an existing article', () => {
      const updatedData = {
        title: 'Updated E2E Test Article',
        content: 'This article has been updated by Cypress E2E test',
        category: 'Updated Technology'
      };

      cy.request({
        method: 'PUT',
        url: `${baseUrl}/articles/${createdArticleId}`,
        body: updatedData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
        if (response.body) {
          expect(response.body.title).to.eq(updatedData.title);
        }
      });

      // Verify the update by fetching the article
      cy.request({
        method: 'GET',
        url: `${baseUrl}/articles/${createdArticleId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.title).to.eq(updatedData.title);
        expect(response.body.content).to.eq(updatedData.content);
      });
    });

    it('should delete an article', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/articles/${createdArticleId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204]);
      });

      // Verify deletion by trying to fetch the deleted article
      cy.request({
        method: 'GET',
        url: `${baseUrl}/articles/${createdArticleId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([404, 400]); // Should not be found
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid article ID gracefully', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/articles/invalid-id`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 404, 500]);
      });
    });

    it('should validate required fields when creating article', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/articles`,
        body: {}, // Empty body
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]); // Validation error
      });
    });

    it('should handle expired or invalid tokens', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/articles`,
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('error');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 10 }, (_, i) => 
        cy.request({
          method: 'GET',
          url: `${baseUrl}/articles`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          failOnStatusCode: false
        })
      );

      // All requests should either succeed or be rate limited
      requests.forEach(request => {
        request.then((response) => {
          expect(response.status).to.be.oneOf([200, 429]); // 429 = Too Many Requests
        });
      });
    });
  });

  after(() => {
    // Cleanup: Delete the test user
    cy.request({
      method: 'POST',
      url: `${baseUrl}/login`,
      body: {
        email: testUser.email,
        password: testUser.password
      },
      failOnStatusCode: false
    }).then((loginResponse) => {
      if (loginResponse.status === 200) {
        // If we have a delete user endpoint, use it here
        // For now, we'll just log out
        cy.request({
          method: 'POST',
          url: `${baseUrl}/logout`,
          headers: {
            'Authorization': `Bearer ${loginResponse.body.token}`
          },
          failOnStatusCode: false
        });
      }
    });
  });
});
