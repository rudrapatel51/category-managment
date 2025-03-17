import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';

let mongo;

// Setup and connect to the in-memory database
export const setupTestDB = async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);
};

// Clear all data and close connection
export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};

// Clear all collections after each test
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// Create a test user and generate token
export const createTestUser = async () => {
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  const token = jwt.sign({ id: user._id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
  
  return { user, token };
};