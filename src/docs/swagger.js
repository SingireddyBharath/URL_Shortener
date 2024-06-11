const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const route = require('../routes/routes')

let hostUrl = 'http://localhost:3002/';

if (process.env.NODE_ENV == 'dev') {
  hostUrl = 'https://08pl881s30.execute-api.us-east-1.amazonaws.com/dev/';
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL shortening service',
      version: '1.0.0',
      description: 'Please use below APIs for URL shortening',
    },
    servers: [
      {
        url: hostUrl
      }
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the routes files
};

const specs = swaggerJsDoc(options);

const swaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};

module.exports = swaggerDocs;