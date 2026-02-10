/**
 * Validation Middleware
 * 
 * Validates incoming requests for prediction endpoints
 */

const { REQUIRED_FEATURES, OPTIONAL_FEATURES, NUMERIC_FEATURES, CATEGORICAL_FEATURES } = require('../config/features.config');

/**
 * Validate prediction input data
 * Checks for required features, data types, boundaries, and logical consistency
 * Test cases covered: PRED-01 to PRED-12
 */
function validatePredictionInput(req, res, next) {
  try {
    const propertyData = req.body;
    
    // Check if body is empty (PRED-06)
    if (!propertyData || Object.keys(propertyData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body is empty',
        requiredFeatures: REQUIRED_FEATURES
      });
    }
    
    // Set default values for optional features if not provided (PRED-05)
    OPTIONAL_FEATURES.forEach(feature => {
      if (!(feature in propertyData) || propertyData[feature] === null || propertyData[feature] === undefined || propertyData[feature] === '') {
        propertyData[feature] = 0;
      }
    });
    
    // Check for missing required features (PRED-02)
    const missingFeatures = REQUIRED_FEATURES.filter(
      feature => !(feature in propertyData) || propertyData[feature] === null || propertyData[feature] === undefined || propertyData[feature] === ''
    );
    
    if (missingFeatures.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required features',
        missingFeatures,
        requiredFeatures: REQUIRED_FEATURES,
        optionalFeatures: OPTIONAL_FEATURES,
        hint: `Required: ${REQUIRED_FEATURES.length} features, Optional: ${OPTIONAL_FEATURES.length} features (will default to 0)`
      });
    }
    
    // Validate data types for numerical features (PRED-03)
    const typeErrors = [];
    
    for (const feature of NUMERIC_FEATURES) {
      const value = propertyData[feature];
      
      // Check if value is numeric (number or numeric string)
      if (value === null || value === undefined) {
        typeErrors.push({
          feature,
          issue: 'Value is null or undefined',
          expected: 'number'
        });
      } else if (typeof value !== 'number' && isNaN(Number(value))) {
        typeErrors.push({
          feature,
          issue: `Invalid value: ${value}`,
          expected: 'number',
          received: typeof value
        });
      }
    }
    
    // Validate categorical features
    for (const feature of CATEGORICAL_FEATURES) {
      const value = propertyData[feature];
      
      if (value === null || value === undefined || value === '') {
        typeErrors.push({
          feature,
          issue: 'Value is null, undefined, or empty',
          expected: 'string'
        });
      }
    }
    
    if (typeErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Data type validation failed',
        errors: typeErrors,
        hint: 'Numerical features should be numbers, categorical features should be strings'
      });
    }
    
    // Validate numeric ranges using FEATURE_RULES (PRED-04, PRED-07)
    const { FEATURE_RULES } = require('../config/features.config');
    const rangeErrors = [];
    
    for (const feature of NUMERIC_FEATURES) {
      const value = parseFloat(propertyData[feature]);
      const rules = FEATURE_RULES[feature];
      
      if (rules) {
        // Check minimum value
        if (rules.min !== undefined && value < rules.min) {
          rangeErrors.push({
            feature,
            issue: `Value ${value} is below minimum ${rules.min}`,
            value,
            min: rules.min,
            max: rules.max
          });
        }
        
        // Check maximum value
        if (rules.max !== undefined && value > rules.max) {
          rangeErrors.push({
            feature,
            issue: `Value ${value} exceeds maximum ${rules.max}`,
            value,
            min: rules.min,
            max: rules.max
          });
        }
      }
    }
    
    // Validate categorical values (PRED-08)
    for (const feature of CATEGORICAL_FEATURES) {
      const value = String(propertyData[feature]);
      const rules = FEATURE_RULES[feature];
      
      if (rules && rules.values && !rules.values.includes(value)) {
        rangeErrors.push({
          feature,
          issue: `Invalid value: "${value}"`,
          allowedValues: rules.values,
          received: value
        });
      }
    }
    
    if (rangeErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Value range validation failed',
        errors: rangeErrors,
        hint: 'Check that all values are within acceptable ranges and categorical values are correct'
      });
    }
    
    // Logical validations (PRED-04 and business logic)
    const logicErrors = [];
    
    // 1. Floor cannot be greater than floor_max
    const floor = parseInt(propertyData.floor);
    const floorMax = parseInt(propertyData.floor_max);
    
    if (floor > floorMax) {
      logicErrors.push({
        issue: 'Floor number cannot be greater than maximum floor in building',
        floor: floor,
        floor_max: floorMax,
        hint: 'Please check floor and floor_max values'
      });
    }
    
    // 2. Check for negative values in area fields (PRED-04)
    const areaFields = ['kitchen_area', 'bath_area', 'other_area', 'extra_area', 'total_area'];
    for (const field of areaFields) {
      const value = parseFloat(propertyData[field]);
      if (value < 0) {
        logicErrors.push({
          feature: field,
          issue: 'Area values cannot be negative',
          value: value,
          hint: 'Please provide a non-negative value'
        });
      }
    }
    
    // 3. Total area consistency check (warning, not error)
    const kitchen = parseFloat(propertyData.kitchen_area) || 0;
    const bath = parseFloat(propertyData.bath_area) || 0;
    const other = parseFloat(propertyData.other_area) || 0;
    const extra = parseFloat(propertyData.extra_area) || 0;
    const total = parseFloat(propertyData.total_area);
    
    const sumOfParts = kitchen + bath + other + extra;
    
    // Only check consistency if user has filled in most individual areas
    // Count how many optional area fields are filled (bath, other, extra)
    const optionalFieldsFilled = [
      bath > 0,
      other > 0,
      extra > 0
    ].filter(Boolean).length;
    
    // Only validate if at least 2 out of 3 optional fields are filled
    // Allow 40% variance for flexibility
    if (sumOfParts > 0 && total > 0 && optionalFieldsFilled >= 2) {
      const variance = Math.abs(total - sumOfParts) / total;
      if (variance > 0.4) {
        logicErrors.push({
          issue: 'Total area seems inconsistent with sum of individual areas',
          total_area: total,
          sum_of_parts: parseFloat(sumOfParts.toFixed(2)),
          variance: `${(variance * 100).toFixed(1)}%`,
          hint: 'Total area should approximately equal kitchen + bath + other + extra areas. This is a warning, prediction will proceed.'
        });
      }
    }
    
    // 4. Extra area count consistency
    const extraAreaCount = parseInt(propertyData.extra_area_count);
    const extraAreaValue = parseFloat(propertyData.extra_area);
    
    if (extraAreaCount > 0 && extraAreaValue === 0) {
      logicErrors.push({
        issue: 'Extra area count is specified but extra area is 0',
        extra_area_count: extraAreaCount,
        extra_area: extraAreaValue,
        hint: 'If you have extra areas, specify the total extra area size'
      });
    }
    
    // 5. Year validation (must be reasonable)
    const year = parseInt(propertyData.year);
    const currentYear = new Date().getFullYear();
    if (year > currentYear + 5) {
      logicErrors.push({
        feature: 'year',
        issue: `Construction year ${year} is too far in the future`,
        value: year,
        hint: `Maximum expected year is ${currentYear + 5}`
      });
    }
    
    if (logicErrors.length > 0) {
      // Check if errors are critical (area consistency is just a warning)
      const criticalErrors = logicErrors.filter(err => 
        !err.issue.includes('inconsistent') && !err.issue.includes('warning')
      );
      
      if (criticalErrors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Logical validation failed',
          errors: criticalErrors,
          warnings: logicErrors.filter(err => err.issue.includes('inconsistent'))
        });
      }
    }
    
    // All validations passed
    next();
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Validation middleware error',
      error: error.message
    });
  }
}

/**
 * Sanitize input data
 * Converts string numbers to actual numbers
 */
function sanitizeInput(req, res, next) {
  try {
    const propertyData = req.body;
    
    // Convert numeric features to numbers
    for (const feature of NUMERIC_FEATURES) {
      if (feature in propertyData) {
        const value = propertyData[feature];
        if (typeof value === 'string') {
          propertyData[feature] = parseFloat(value);
        }
      }
    }
    
    // Ensure categorical features are strings
    for (const feature of CATEGORICAL_FEATURES) {
      if (feature in propertyData) {
        propertyData[feature] = String(propertyData[feature]);
      }
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Input sanitization error',
      error: error.message
    });
  }
}

module.exports = {
  validatePredictionInput,
  sanitizeInput
};
