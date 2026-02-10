/**
 * Validation Rules for Real Estate Price Prediction
 * Based on TEST_CASES.md requirements
 */

// Feature validation rules (matching backend config)
export const FEATURE_RULES = {
  kitchen_area: { type: 'number', min: 0, max: 100, required: true, label: 'Kitchen Area' },
  bath_area: { type: 'number', min: 0, max: 50, required: false, label: 'Bathroom Area' },
  other_area: { type: 'number', min: 0, max: 200, required: false, label: 'Other Area' },
  extra_area: { type: 'number', min: 0, max: 50, required: false, label: 'Extra Area' },
  extra_area_count: { type: 'number', min: 0, max: 10, required: true, label: 'Extra Area Count' },
  year: { type: 'number', min: 1900, max: 2030, required: true, label: 'Construction Year' },
  ceil_height: { type: 'number', min: 2.0, max: 5.0, required: true, label: 'Ceiling Height', step: 0.1 },
  floor_max: { type: 'number', min: 1, max: 100, required: true, label: 'Maximum Floor' },
  floor: { type: 'number', min: 1, max: 100, required: true, label: 'Floor Number' },
  total_area: { type: 'number', min: 10, max: 500, required: true, label: 'Total Area' },
  bath_count: { type: 'number', min: 0, max: 10, required: true, label: 'Bathroom Count' },
  rooms_count: { type: 'number', min: 0, max: 20, required: true, label: 'Number of Rooms' },
  gas: { type: 'string', values: ['Yes', 'No'], required: true, label: 'Gas Availability' },
  hot_water: { type: 'string', values: ['Yes', 'No'], required: true, label: 'Hot Water' },
  central_heating: { type: 'string', values: ['Yes', 'No'], required: true, label: 'Central Heating' },
  extra_area_type_name: { type: 'string', required: true, label: 'Extra Area Type' },
  district_name: { type: 'string', required: true, label: 'District Name' }
};

// Required fields
export const REQUIRED_FEATURES = [
  'kitchen_area', 'extra_area_count', 'year', 'ceil_height', 'floor_max',
  'floor', 'total_area', 'bath_count', 'rooms_count', 'gas', 'hot_water',
  'central_heating', 'extra_area_type_name', 'district_name'
];

// Optional fields
export const OPTIONAL_FEATURES = ['bath_area', 'other_area', 'extra_area'];

/**
 * Validate a single field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {object} allFormData - All form data for cross-field validation
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (fieldName, value, allFormData = {}) => {
  const rules = FEATURE_RULES[fieldName];
  
  if (!rules) {
    return null; // Unknown field, skip validation
  }

  const label = rules.label || fieldName;

  // Check if required
  if (rules.required) {
    if (value === null || value === undefined || value === '') {
      return `${label} is required`;
    }
  }

  // If optional and empty, it's valid
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  // Type validation
  if (rules.type === 'number') {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return `${label} must be a valid number`;
    }

    // Range validation
    if (rules.min !== undefined && numValue < rules.min) {
      return `${label} must be at least ${rules.min}`;
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return `${label} must not exceed ${rules.max}`;
    }

    // Special validations for specific fields
    if (fieldName === 'floor' && allFormData.floor_max) {
      const maxFloor = parseFloat(allFormData.floor_max);
      if (!isNaN(maxFloor) && numValue > maxFloor) {
        return 'Floor cannot be greater than maximum floor';
      }
    }

    if (fieldName === 'floor_max' && allFormData.floor) {
      const floor = parseFloat(allFormData.floor);
      if (!isNaN(floor) && numValue < floor) {
        return 'Maximum floor cannot be less than floor number';
      }
    }
  }

  // Categorical validation
  if (rules.type === 'string' && rules.values) {
    if (!rules.values.includes(value)) {
      return `${label} must be one of: ${rules.values.join(', ')}`;
    }
  }

  return null; // Valid
};

/**
 * Validate entire prediction form
 * @param {object} formData - Form data object
 * @returns {object} Object with field names as keys and error messages as values
 */
export const validatePredictionForm = (formData) => {
  const errors = {};

  // Validate all fields
  Object.keys(FEATURE_RULES).forEach(fieldName => {
    const error = validateField(fieldName, formData[fieldName], formData);
    if (error) {
      errors[fieldName] = error;
    }
  });

  // Cross-field logical validations
  
  // 1. Total area consistency check
  const kitchen = parseFloat(formData.kitchen_area) || 0;
  const bath = parseFloat(formData.bath_area) || 0;
  const other = parseFloat(formData.other_area) || 0;
  const extra = parseFloat(formData.extra_area) || 0;
  const total = parseFloat(formData.total_area) || 0;

  const sumOfParts = kitchen + bath + other + extra;
  
  // Only check consistency if user has filled in most individual areas
  // Count how many optional area fields are filled (bath, other, extra)
  const optionalFieldsFilled = [
    formData.bath_area && parseFloat(formData.bath_area) > 0,
    formData.other_area && parseFloat(formData.other_area) > 0,
    formData.extra_area && parseFloat(formData.extra_area) > 0
  ].filter(Boolean).length;
  
  // Only validate if at least 2 out of 3 optional fields are filled
  // This means user is providing detailed breakdown
  if (total > 0 && sumOfParts > 0 && optionalFieldsFilled >= 2) {
    const variance = Math.abs(total - sumOfParts) / total;
    if (variance > 0.3) {
      errors.total_area = `Total area (${total}m²) seems inconsistent with sum of parts (${sumOfParts.toFixed(1)}m²)`;
    }
  }

  // 2. Extra area count consistency
  const extraAreaCount = parseInt(formData.extra_area_count) || 0;
  const extraAreaValue = parseFloat(formData.extra_area) || 0;
  
  if (extraAreaCount > 0 && extraAreaValue === 0) {
    errors.extra_area = 'Extra area should be greater than 0 when extra area count is specified';
  }

  if (extraAreaCount === 0 && extraAreaValue > 0) {
    errors.extra_area_count = 'Extra area count should be greater than 0 when extra area is specified';
  }

  return errors;
};

/**
 * Validate authentication registration form
 * @param {object} formData - Registration form data
 * @returns {object} Validation errors
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};

  // Name validation (AUTH-05)
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Email validation (AUTH-03, AUTH-05)
  if (!formData.email || formData.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Password validation (AUTH-04, AUTH-05)
  if (!formData.password || formData.password.length === 0) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  // Confirm password validation
  if (formData.confirmPassword !== formData.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

/**
 * Validate login form
 * @param {object} formData - Login form data
 * @returns {object} Validation errors
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  // Email validation (AUTH-06)
  if (!formData.email || formData.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Password validation (AUTH-06)
  if (!formData.password || formData.password.length === 0) {
    errors.password = 'Password is required';
  }

  return errors;
};

/**
 * Check if form has any errors
 * @param {object} errors - Errors object
 * @returns {boolean} True if has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Get formatted error message for display
 * @param {object} errors - Errors object
 * @returns {string} Formatted error message
 */
export const getErrorSummary = (errors) => {
  const errorCount = Object.keys(errors).length;
  if (errorCount === 0) return '';
  if (errorCount === 1) return Object.values(errors)[0];
  return `Please fix ${errorCount} validation errors`;
};
