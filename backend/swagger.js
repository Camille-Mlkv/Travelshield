import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Travelshield API',
    version: '1.0.0',
    description: 'Travelshield API Documentation',
  },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
    },
  },
  security: [{
    bearerAuth: []
  }],
  definitions: {
    Error: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
};
const outputFile = './swagger-output.json';
const routes = ['./index.js'];

swaggerAutogen()(outputFile, routes, doc);