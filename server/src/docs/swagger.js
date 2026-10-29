import swaggerUi from 'swagger-ui-express';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'RideFlow API',
    version: '1.0.0',
    description: 'Complete Uber-Style Ride Booking Platform REST API',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 prefix',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'rideflow_token',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register passenger or driver',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['passenger', 'driver'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Account created' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in user and set HttpOnly cookie',
        responses: { 200: { description: 'Logged in successfully' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user session, profile, and active ride',
        responses: { 200: { description: 'Current user payload' } },
      },
    },
    '/passenger/rides/estimate': {
      post: {
        summary: 'Calculate route distance, duration, and category fare estimates',
        responses: { 200: { description: 'Route & estimates' } },
      },
    },
    '/passenger/rides': {
      post: {
        summary: 'Request / book a new ride',
        responses: { 201: { description: 'Ride created & matching initiated' } },
      },
    },
    '/driver/availability': {
      post: {
        summary: 'Toggle online/offline status (approved drivers only)',
        responses: { 200: { description: 'Availability updated' } },
      },
    },
    '/driver/offers/{id}/accept': {
      post: {
        summary: 'Atomically accept ride offer',
        responses: { 200: { description: 'Offer accepted' } },
      },
    },
    '/driver/rides/{id}/start': {
      post: {
        summary: 'Start trip with verified 4-digit PIN',
        responses: { 200: { description: 'Ride started' } },
      },
    },
    '/driver/rides/{id}/complete': {
      post: {
        summary: 'Complete trip and calculate authoritative final fare',
        responses: { 200: { description: 'Ride completed' } },
      },
    },
    '/admin/dashboard': {
      get: {
        summary: 'Operational metrics and revenue trends',
        responses: { 200: { description: 'Dashboard metrics' } },
      },
    },
  },
};

export const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] API Documentation mounted at /api/docs');
};
