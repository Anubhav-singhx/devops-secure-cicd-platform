const request = require('supertest');
const app = require('../src/server');

describe('Health Check Endpoint', () => {
  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health');
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('service', 'task-manager-backend');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('Authentication Endpoints', () => {
  it('should reject login with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notanemail' }); 

    expect(response.status).toBe(400);
  });

  it('should reject registration with short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      });

    expect(response.status).toBe(400);
  });
});

describe('Tasks Endpoints', () => {
  it('should return 401 when accessing tasks without token', async () => {
    const response = await request(app)
      .get('/api/tasks');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 401 when creating task without token', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task' });

    expect(response.status).toBe(401);
  });
});

describe('Metrics Endpoint', () => {
  it('should expose Prometheus metrics', async () => {
    const response = await request(app)
      .get('/metrics');

    expect(response.status).toBe(200);
    expect(response.text).toContain('nodejs_version_info');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/this-does-not-exist');

    expect(response.status).toBe(404);
  });
});