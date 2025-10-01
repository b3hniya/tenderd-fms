import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'tenderd FMS API',
    version: '1.0.0',
    description: 'Fleet Management System API Documentation',
    contact: {
      name: 'tenderd FMS Team',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? `https://${process.env.HOST || 'localhost'}:${process.env.PORT || 4000}`
        : `http://localhost:${process.env.PORT || 4000}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            description: 'HTTP status code',
          },
          message: {
            type: 'string',
            description: 'Error message',
          },
        },
        required: ['status', 'message'],
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Success status',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/modules/**/controllers/**/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
