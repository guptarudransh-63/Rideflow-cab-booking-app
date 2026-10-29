import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

let app;

beforeAll(async () => {
  await connectDB();
  app = createApp();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Authentication & User Management Integration Tests', () => {
  const testEmail = `test_${Date.now()}@rideflow.com`;

  it('should register a new passenger successfully and set HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Passenger',
        email: testEmail,
        phone: '+15551234567',
        password: 'password123',
        role: 'passenger',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('passenger');

    // Verify cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('rideflow_token=');
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate User',
        email: testEmail,
        phone: '+15551234567',
        password: 'password123',
        role: 'passenger',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login passenger with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
