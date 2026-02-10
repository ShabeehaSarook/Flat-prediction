/**
 * Real Estate Price Prediction - Node.js/Express Backend
 * 
 * This server acts as a middleware between clients and the Flask ML API.
 * It provides RESTful endpoints for property price predictions and handles
 * communication with the Flask machine learning service.
 * 
 * Features:
 * - RESTful API endpoints
 * - Connection to Flask ML API
 * - Request validation
 * - Error handling
 * - CORS support
 * - Logging
 * - Security headers
 * 
 * Author: Real Estate Prediction Team
 * Date: February 2026
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const predictionRoutes = require('./routes/prediction.routes');
const healthRoutes = require('./routes/health.routes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (only in development)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check routes
app.use('/api/health', healthRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Prediction routes (connects to Flask API)
app.use('/api/predict', predictionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: '🏠 Real Estate Price Prediction API - Node.js/Express Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      healthFlask: '/api/health/flask',
      predict: '/api/predict',
      validateFeatures: '/api/predict/validate'
    },
    documentation: 'See README.md for API documentation'
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      '/',
      '/api/health',
      '/api/health/flask',
      '/api/predict',
      '/api/predict/validate'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start server - Listen on all interfaces (0.0.0.0) to fix network issues
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Real Estate Price Prediction - Node.js Backend');
  console.log('='.repeat(70));
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`📍 Also available at: http://127.0.0.1:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 Flask API: ${process.env.FLASK_API_URL}`);
  console.log(`⚡ Ready to accept requests!`);
  console.log('='.repeat(70) + '\n');
  
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/health/flask`);
  console.log(`  POST http://localhost:${PORT}/api/predict`);
  console.log(`  POST http://localhost:${PORT}/api/predict/validate`);
  console.log('\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
