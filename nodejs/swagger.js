const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mod List API',
      version: '0.9.1',
      description: 'A simple Express API for querying the mod list database.',
    },
    servers: [
      {
        url: 'https://localhost:3000',
        url: 'https://api.astromods.xyz',
      },
    ],
  },
  apis: ['./app.js'], // Path to the app.js file
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};