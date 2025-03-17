import request from 'supertest';
import app from '../index.js';
import { setupTestDB, closeTestDB, clearDatabase, createTestUser } from './testSetup.js';
import Category from '../models/Category.js';

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

describe('Category API', () => {
  let token;

  beforeEach(async () => {
    // Create a test user and get token
    const testUser = await createTestUser();
    token = testUser.token;
  });

  describe('POST /api/category', () => {
    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Category'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('name', 'Test Category');
      expect(res.body.data).toHaveProperty('parent', null);
      expect(res.body.data).toHaveProperty('status', 'active');
    });

    it('should create a child category', async () => {
      // Create a parent category first
      const parentCategory = await Category.create({
        name: 'Parent Category'
      });

      const res = await request(app)
        .post('/api/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Child Category',
          parent: parentCategory._id
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('name', 'Child Category');
      expect(res.body.data).toHaveProperty('parent', parentCategory._id.toString());
      expect(res.body.data).toHaveProperty('level', 2);
    });

    it('should inherit inactive status from parent', async () => {
      // Create an inactive parent category first
      const parentCategory = await Category.create({
        name: 'Inactive Parent',
        status: 'inactive'
      });

      const res = await request(app)
        .post('/api/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Child Category',
          parent: parentCategory._id,
          status: 'active' // This should be overridden
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'inactive');
    });
  });

  describe('GET /api/category', () => {
    it('should get categories as a tree structure', async () => {
      // Create some categories
      const parentCategory1 = await Category.create({
        name: 'Electronics'
      });

      const parentCategory2 = await Category.create({
        name: 'Clothing'
      });

      const childCategory1 = await Category.create({
        name: 'Phones',
        parent: parentCategory1._id
      });

      const childCategory2 = await Category.create({
        name: 'T-Shirts',
        parent: parentCategory2._id
      });

      const res = await request(app)
        .get('/api/category')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveLength(2);

      // Check if tree structure is correct
      expect(res.body.data[0]).toHaveProperty('name', 'Clothing');
      expect(res.body.data[0]).toHaveProperty('children');
      expect(res.body.data[0].children).toHaveLength(1);
      expect(res.body.data[0].children[0]).toHaveProperty('name', 'T-Shirts');

      expect(res.body.data[1]).toHaveProperty('name', 'Electronics');
      expect(res.body.data[1]).toHaveProperty('children');
      expect(res.body.data[1].children).toHaveLength(1);
      expect(res.body.data[1].children[0]).toHaveProperty('name', 'Phones');
    });
  });

  describe('PUT /api/category/:id', () => {
    it('should update a category name', async () => {
      const category = await Category.create({
        name: 'Original Name'
      });

      const res = await request(app)
        .put(`/api/category/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('name', 'Updated Name');
    });

    it('should update a category status and all its children', async () => {
      // Create a parent with a child
      const parentCategory = await Category.create({
        name: 'Parent Category'
      });

      const childCategory = await Category.create({
        name: 'Child Category',
        parent: parentCategory._id
      });

      const res = await request(app)
        .put(`/api/category/${parentCategory._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'inactive'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'inactive');

      // Check if child status was updated
      const updatedChild = await Category.findById(childCategory._id);
      expect(updatedChild.status).toEqual('inactive');
    });
  });

  describe('DELETE /api/category/:id', () => {
    it('should delete a category and reassign its children to its parent', async () => {
      // Create a hierarchy: GrandParent -> Parent -> Child
      const grandParent = await Category.create({
        name: 'Grand Parent'
      });

      const parent = await Category.create({
        name: 'Parent',
        parent: grandParent._id
      });

      const child = await Category.create({
        name: 'Child',
        parent: parent._id
      });

      // Delete the parent
      const res = await request(app)
        .delete(`/api/category/${parent._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);

      // Check if child was reassigned to grandparent
      const updatedChild = await Category.findById(child._id);
      expect(updatedChild.parent.toString()).toEqual(grandParent._id.toString());
      expect(updatedChild.level).toEqual(2);
    });

    it('should delete a category and make its children root categories if no parent', async () => {
      // Create a parent with a child
      const parent = await Category.create({
        name: 'Parent'
      });

      const child = await Category.create({
        name: 'Child',
        parent: parent._id
      });

      // Delete the parent
      const res = await request(app)
        .delete(`/api/category/${parent._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);

      // Check if child became a root category
      const updatedChild = await Category.findById(child._id);
      expect(updatedChild.parent).toBeNull();
      expect(updatedChild.level).toEqual(1);
    });
  });
});