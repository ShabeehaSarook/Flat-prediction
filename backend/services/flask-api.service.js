/**
 * Flask API Service
 * 
 * Handles all communication with the Flask ML API.
 * Provides methods to check Flask API health and make predictions.
 */

const axios = require('axios');

// Flask API configuration
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5000';
const FLASK_API_TIMEOUT = parseInt(process.env.FLASK_API_TIMEOUT) || 30000;

// Create axios instance with default config
const flaskClient = axios.create({
  baseURL: FLASK_API_URL,
  timeout: FLASK_API_TIMEOUT,

  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Check if Flask API is running and healthy
 * @returns {Promise<Object>} Health status
 */
async function checkFlaskHealth() {
  try {
    const response = await flaskClient.get('/', { timeout: 5000 });
    
    return {
      status: 'healthy',
      url: FLASK_API_URL,
      responseTime: response.headers['x-response-time'] || 'N/A',
      message: response.data
    };
  } catch (error) {
    console.error('Flask API health check failed:', error.message);
    
    return {
      status: 'unhealthy',
      url: FLASK_API_URL,
      error: error.message,
      code: error.code,
      suggestion: 'Make sure Flask API is running: python backend/app.py'
    };
  }
}

/**
 * Make a prediction request to Flask API
 * @param {Object} propertyData - Property features
 * @returns {Promise<Object>} Prediction result
 */
async function predictPrice(propertyData) {
  try {
    const startTime = Date.now();
    
    // Make prediction request to Flask API
    const response = await flaskClient.post('/predict', propertyData);
    
    const responseTime = Date.now() - startTime;
    
    // Validate response
    if (!response.data || typeof response.data.predicted_price === 'undefined') {
      throw new Error('Invalid response from Flask API: missing predicted_price');
    }
    
    return {
      success: true,
      prediction: {
        price: response.data.predicted_price,
        priceFormatted: formatPrice(response.data.predicted_price),
        priceInMillions: (response.data.predicted_price / 1_000_000).toFixed(2),
        currency: 'RUB'
      },
      metadata: {
        modelVersion: response.data.model_version || 'v1.0',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        note: response.data.note || 'Prediction generated successfully'
      }
    };
  } catch (error) {
    console.error('Flask API prediction error:', error.message);
    
    // Handle different error types
    if (error.response) {
      // Flask API returned an error response
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 400) {
        // Missing features or validation error
        return {
          success: false,
          error: 'Validation error',
          message: data.error || 'Invalid input data',
          details: data.missing ? {
            missingFeatures: data.missing,
            requiredFeatures: data.required_features
          } : null
        };
      } else if (status === 500) {
        // Flask API internal error
        return {
          success: false,
          error: 'Flask API error',
          message: data.error || 'Internal server error in Flask API'
        };
      } else {
        return {
          success: false,
          error: 'HTTP error',
          message: `Flask API returned status ${status}`,
          details: data
        };
      }
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'Connection error',
        message: 'Cannot connect to Flask API',
        suggestion: 'Make sure Flask API is running at ' + FLASK_API_URL,
        code: error.code
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: 'Request error',
        message: error.message
      };
    }
  }
}

/**
 * Format price with thousand separators
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Test connection to Flask API with sample data
 * @returns {Promise<Object>} Test result
 */
async function testFlaskConnection() {
  const sampleData = {
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
  };
  
  try {
    const result = await predictPrice(sampleData);
    
    if (result.success) {
      return {
        status: 'success',
        message: 'Flask API connection test successful',
        prediction: result.prediction
      };
    } else {
      return {
        status: 'failed',
        message: 'Flask API connection test failed',
        error: result.error
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Flask API connection test error',
      error: error.message
    };
  }
}

module.exports = {
  checkFlaskHealth,
  predictPrice,
  testFlaskConnection,
  FLASK_API_URL
};
