/**
 * Prediction Model
 * Stores prediction history for users
 */

const mongoose = require('mongoose');

const predictionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    propertyData: {
      kitchen_area: { type: Number, required: true },
      bath_area: { type: Number, required: true },
      other_area: { type: Number, required: true },
      extra_area: { type: Number, required: true },
      extra_area_count: { type: Number, required: true },
      year: { type: Number, required: true },
      ceil_height: { type: Number, required: true },
      floor_max: { type: Number, required: true },
      floor: { type: Number, required: true },
      total_area: { type: Number, required: true },
      bath_count: { type: Number, required: true },
      rooms_count: { type: Number, required: true },
      gas: { type: String, required: true },
      hot_water: { type: String, required: true },
      central_heating: { type: String, required: true },
      extra_area_type_name: { type: String, required: true },
      district_name: { type: String, required: true },
    },
    predictedPrice: {
      type: Number,
      required: true,
    },
    priceInMillions: {
      type: String,
      required: true,
    },
    modelVersion: {
      type: String,
      default: 'v1.0',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Prediction', predictionSchema);
