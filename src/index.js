import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/db.js';
import config from './config/config.js';
import { errorHandler } from './utils/errorHandler.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Category Management API'
  });
});

// Error handler middleware
app.use(errorHandler);

const PORT = config.port;

const server = app.listen(
  PORT,
  console.log(`Server running in ${config.env} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;