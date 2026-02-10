/**
 * Feature Configuration for Real Estate Price Prediction
 * 
 * This file defines all required features for the ML model.
 * These must match exactly with the Flask API requirements.
 */

// Required features that must be provided
const REQUIRED_FEATURES = [
  // Numerical features (9 required)
  'kitchen_area',
  'extra_area_count',
  'year',
  'ceil_height',
  'floor_max',
  'floor',
  'total_area',
  'bath_count',
  'rooms_count',
  
  // Categorical features (5)
  'gas',
  'hot_water',
  'central_heating',
  'extra_area_type_name',
  'district_name'
];

// Optional features that will default to 0 if not provided
const OPTIONAL_FEATURES = [
  'bath_area',
  'other_area',
  'extra_area'
];

// All features (required + optional = 17 total for ML model)
const ALL_FEATURES = [...REQUIRED_FEATURES, ...OPTIONAL_FEATURES];

// Numerical features
const NUMERIC_FEATURES = [
  'kitchen_area',
  'bath_area',
  'other_area',
  'extra_area',
  'extra_area_count',
  'year',
  'ceil_height',
  'floor_max',
  'floor',
  'total_area',
  'bath_count',
  'rooms_count'
];

// Categorical features
const CATEGORICAL_FEATURES = [
  'gas',
  'hot_water',
  'central_heating',
  'extra_area_type_name',
  'district_name'
];

// Feature validation rules
const FEATURE_RULES = {
  kitchen_area: { type: 'number', min: 0, max: 100 },
  bath_area: { type: 'number', min: 0, max: 50 },
  other_area: { type: 'number', min: 0, max: 200 },
  extra_area: { type: 'number', min: 0, max: 50 },
  extra_area_count: { type: 'number', min: 0, max: 10 },
  year: { type: 'number', min: 1900, max: 2030 },
  ceil_height: { type: 'number', min: 2.0, max: 5.0 },
  floor_max: { type: 'number', min: 1, max: 100 },
  floor: { type: 'number', min: 1, max: 100 },
  total_area: { type: 'number', min: 10, max: 500 },
  bath_count: { type: 'number', min: 0, max: 10 },
  rooms_count: { type: 'number', min: 0, max: 20 },
  gas: { type: 'string', values: ['Yes', 'No'] },
  hot_water: { type: 'string', values: ['Yes', 'No'] },
  central_heating: { type: 'string', values: ['Yes', 'No'] },
  extra_area_type_name: { type: 'string' },
  district_name: { type: 'string' }
};

// Feature descriptions for documentation
const FEATURE_DESCRIPTIONS = {
  kitchen_area: 'Kitchen size in square meters',
  bath_area: 'Bathroom size in square meters',
  other_area: 'Other area in square meters',
  extra_area: 'Extra area (balcony, etc.) in square meters',
  extra_area_count: 'Number of extra areas',
  year: 'Construction year',
  ceil_height: 'Ceiling height in meters',
  floor_max: 'Maximum floor in building',
  floor: 'Property floor number',
  total_area: 'Total area in square meters',
  bath_count: 'Number of bathrooms',
  rooms_count: 'Number of rooms',
  gas: 'Gas availability (Yes/No)',
  hot_water: 'Hot water availability (Yes/No)',
  central_heating: 'Central heating (Yes/No)',
  extra_area_type_name: 'Type of extra area (e.g., balkon, lodzhija, net)',
  district_name: 'District/neighborhood name'
};

module.exports = {
  REQUIRED_FEATURES,
  OPTIONAL_FEATURES,
  ALL_FEATURES,
  NUMERIC_FEATURES,
  CATEGORICAL_FEATURES,
  FEATURE_RULES,
  FEATURE_DESCRIPTIONS
};
