import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Configure Swagger definitions. The `apis` property points to files where JSDoc
// comments are used to auto‑generate API paths. You can extend the
// specification manually or add more annotations in `src/main.ts`.
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema SG‑SST API',
      version: '1.0.0',
      description: 'Documentación Swagger del API de gestión SST',
    },
  },
  apis: ['./src/main.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}