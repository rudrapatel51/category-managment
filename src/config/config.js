import dotenv from 'dotenv';

// Load env vars
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  }
};