import request from 'supertest';
import app from '../src/index.js';
import { setupTestDB, closeTestDB, clearDatabase } from './testSetup.js';
import User from '../src/models/User.js';

// Setup DB before tests
beforeAll(async () => {
  await setupTestDB();
});

// Clear DB after each test
afterEach(async () => {
  await clearDatabase();
});

// Close DB connection after all tests
afterAll(async () => {
  await closeTestDB();
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });
    
    it('should not register a user with duplicate email', async () => {
      // Create first user
      await User.create({
        name: 'First User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Try to create second user with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'User already exists');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login user and return token', async () => {
      // Create a user first
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });
    
    it('should not login with incorrect password', async () => {
      // Create a user first
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Try to login with wrong password
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
    
    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      // Create a user first
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      const token = loginRes.body.token;
      
      // Get profile
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).toHaveProperty('email', 'test@example.com');
    });
    
    it('should not get profile without token', async () => {
      const res = await request(app).get('/api/auth/me');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Not authorized, no token');
    });
  });
});