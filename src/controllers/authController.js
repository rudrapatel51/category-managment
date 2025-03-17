import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ErrorResponse } from '../utils/errorHandler.js';
import config from '../config/config.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return next(new ErrorResponse('User already exists', 400));
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Send token in response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    // Send token in response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = generateToken(user._id);
  
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, getMe };