/**
 * Health Check Routes
 * 
 * Endpoints for checking the health of Node.js backend and Flask API
 */

const express = require('express');
const router = express.Router();
const { checkFlaskHealth, testFlaskConnection } = require('../services/flask-api.service');

/**
 * GET /api/health
 * Check Node.js backend health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Node.js Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /api/health/flask
 * Check Flask API health and connectivity
 */
router.get('/flask', async (req, res) => {
  try {
    const flaskHealth = await checkFlaskHealth();
    
    if (flaskHealth.status === 'healthy') {
      res.json({
        status: 'success',
        message: 'Flask API is healthy',
        flask: flaskHealth
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Flask API is not responding',
        flask: flaskHealth
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check Flask API health',
      error: error.message
    });
  }
});

/**
 * GET /api/health/test
 * Test Flask API connection with sample prediction
 */
router.get('/test', async (req, res) => {
  try {
    const testResult = await testFlaskConnection();
    
    if (testResult.status === 'success') {
      res.json({
        status: 'success',
        message: 'Flask API connection test passed',
        result: testResult
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Flask API connection test failed',
        result: testResult
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to test Flask API connection',
      error: error.message
    });
  }
});

module.exports = router;
