/**
 * Prediction Routes
 * 
 * Endpoints for property price predictions
 */

const express = require('express');
const router = express.Router();
const {
  makePrediction,
  getPredictionHistory,
  getAllPredictions,
  getPredictionById,
  updatePrediction,
  deletePrediction,
  deleteMultiplePredictions,
  getPredictionStats,
} = require('../controllers/prediction.controller');
const { predictPrice } = require('../services/flask-api.service');
const { validatePredictionInput } = require('../middleware/validation.middleware');
const { protect, admin } = require('../middleware/auth.middleware');
const { REQUIRED_FEATURES, FEATURE_DESCRIPTIONS } = require('../config/features.config');

/**
 * POST /api/predict/validate
 * Validate property data without making a prediction
 */
router.post('/validate', (req, res) => {
  try {
    const propertyData = req.body;
    
    // Check for missing features
    const missingFeatures = REQUIRED_FEATURES.filter(
      feature => !(feature in propertyData)
    );
    
    // Check for extra features
    const extraFeatures = Object.keys(propertyData).filter(
      key => !REQUIRED_FEATURES.includes(key)
    );
    
    if (missingFeatures.length === 0) {
      res.json({
        status: 'success',
        message: 'All required features are present',
        valid: true,
        extraFeatures: extraFeatures.length > 0 ? extraFeatures : []
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Missing required features',
        valid: false,
        missingFeatures,
        requiredFeatures: REQUIRED_FEATURES
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Validation failed',
      error: error.message
    });
  }
});

/**
 * GET /api/predict/features
 * Get information about required features
 */
router.get('/features', (req, res) => {
  res.json({
    status: 'success',
    totalFeatures: REQUIRED_FEATURES.length,
    requiredFeatures: REQUIRED_FEATURES,
    featureDescriptions: FEATURE_DESCRIPTIONS,
    categories: {
      numerical: 12,
      categorical: 5
    }
  });
});

/**
 * GET /api/predict/example
 * Get an example prediction request
 */
router.get('/example', (req, res) => {
  res.json({
    status: 'success',
    message: 'Example property data for prediction',
    example: {
      kitchen_area: 12.0,
      bath_area: 5.0,
      other_area: 10.0,
      extra_area: 3.0,
      extra_area_count: 1,
      year: 2015,
      ceil_height: 2.7,
      floor_max: 10,
      floor: 5,
      total_area: 65.0,
      bath_count: 1,
      rooms_count: 2,
      gas: 'Yes',
      hot_water: 'Yes',
      central_heating: 'Yes',
      extra_area_type_name: 'balkon',
      district_name: 'Centralnyj'
    },
    usage: {
      endpoint: 'POST /api/predict',
      contentType: 'application/json',
      body: 'Send the property data as JSON in the request body'
    }
  });
});

/**
 * POST /api/predict
 * Make a price prediction for a property (requires authentication)
 */
router.post('/', protect, validatePredictionInput, makePrediction);

/**
 * GET /api/predict/history
 * Get user's prediction history
 */
router.get('/history', protect, getPredictionHistory);

/**
 * GET /api/predict/all
 * Get all predictions (Admin only)
 */
router.get('/all', protect, admin, getAllPredictions);

/**
 * GET /api/predict/stats
 * Get prediction statistics (Admin only)
 */
router.get('/stats', protect, admin, getPredictionStats);

/**
 * POST /api/predict/delete-multiple
 * Delete multiple predictions (Admin only)
 */
router.post('/delete-multiple', protect, admin, deleteMultiplePredictions);

/**
 * GET /api/predict/:id
 * Get single prediction by ID
 */
router.get('/:id', protect, getPredictionById);

/**
 * PUT /api/predict/:id
 * Update a prediction (Admin only)
 */
router.put('/:id', protect, admin, updatePrediction);

/**
 * DELETE /api/predict/:id
 * Delete a prediction
 */
router.delete('/:id', protect, deletePrediction);

module.exports = router;
