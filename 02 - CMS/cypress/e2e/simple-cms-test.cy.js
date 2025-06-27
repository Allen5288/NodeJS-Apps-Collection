describe('Simple CMS API E2E Test', () => {
  const baseUrl = 'http://localhost:5000/api/v1';
  
  it('should complete a full user journey: register → login → create article → get articles', () => {
    const testUser = {
      username: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'testpass123'
    };

    // Step 1: Register a new user
    cy.request({
      method: 'POST',
      url: `${baseUrl}/register`,
      body: testUser,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([201, 400]);
    });

    // Step 2: Login to get authentication token
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
      
      const authToken = response.body.token;

      // Step 3: Create a new article
      cy.request({
        method: 'POST',
        url: `${baseUrl}/articles`,
        body: {
          title: 'My First E2E Article',
          content: 'This article was created by Cypress E2E test',
          author: testUser.username,
          category: 'Testing'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((createResponse) => {
        expect(createResponse.status).to.be.oneOf([200, 201]);
        expect(createResponse.body).to.have.property('title', 'My First E2E Article');

        // Step 4: Get all articles to verify our article was created
        cy.request({
          method: 'GET',
          url: `${baseUrl}/articles`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body).to.be.an('array');
          
          // Verify our article is in the list
          const ourArticle = getResponse.body.find(article => 
            article.title === 'My First E2E Article'
          );
          expect(ourArticle).to.exist;
          expect(ourArticle.author).to.eq(testUser.username);
        });
      });
    });
  });

  it('should handle authentication errors properly', () => {
    // Try to access protected route without token
    cy.request({
      method: 'GET',
      url: `${baseUrl}/articles`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property('error');
    });

    // Try to access protected route with invalid token
    cy.request({
      method: 'GET',
      url: `${baseUrl}/articles`,
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property('error');
    });
  });
});
