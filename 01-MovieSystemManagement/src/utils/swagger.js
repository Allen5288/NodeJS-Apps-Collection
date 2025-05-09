const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie api',
      version: '0.0.1',
      description: 'a simple movie api doc',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'dev server',
      },
    ],
  },
  apis: ['./src/controllers/*.js'],
};

module.exports = swaggerJsDoc(options);
