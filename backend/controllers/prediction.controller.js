/**
 * Prediction Controller
 * Handles ML predictions and history
 */

const asyncHandler = require('express-async-handler');
const Prediction = require('../models/Prediction');
const { predictPrice } = require('../services/flask-api.service');

// @desc    Make a prediction
// @route   POST /api/predict
// @access  Private
const makePrediction = asyncHandler(async (req, res) => {
  const propertyData = req.body;

  // Call Flask API for prediction
  const result = await predictPrice(propertyData);

  if (result.success) {
    // Save prediction to database
    const prediction = await Prediction.create({
      user: req.user._id,
      propertyData,
      predictedPrice: result.prediction.price,
      priceInMillions: result.prediction.priceInMillions,
      modelVersion: result.metadata.modelVersion,
    });

    res.json({
      status: 'success',
      data: {
        _id: prediction._id,
        predictedPrice: result.prediction.price,
        priceFormatted: result.prediction.priceFormatted,
        priceInMillions: result.prediction.priceInMillions,
        currency: result.prediction.currency,
      },
      metadata: result.metadata,
    });
  } else {
    res.status(400);
    throw new Error(result.message || 'Prediction failed');
  }
});

// @desc    Get user's prediction history
// @route   GET /api/predict/history
// @access  Private
const getPredictionHistory = asyncHandler(async (req, res) => {
  const predictions = await Prediction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    status: 'success',
    count: predictions.length,
    data: predictions,
  });
});

// @desc    Get all predictions (Admin only)
// @route   GET /api/predict/all
// @access  Private/Admin
const getAllPredictions = asyncHandler(async (req, res) => {
  const predictions = await Prediction.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({
    status: 'success',
    count: predictions.length,
    data: predictions,
  });
});

// @desc    Get single prediction by ID
// @route   GET /api/predict/:id
// @access  Private
const getPredictionById = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findById(req.params.id)
    .populate('user', 'name email role');

  if (!prediction) {
    res.status(404);
    throw new Error('Prediction not found');
  }

  // Check ownership or admin
  if (prediction.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this prediction');
  }

  res.json({
    status: 'success',
    data: prediction,
  });
});

// @desc    Update a prediction
// @route   PUT /api/predict/:id
// @access  Private/Admin
const updatePrediction = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findById(req.params.id);

  if (!prediction) {
    res.status(404);
    throw new Error('Prediction not found');
  }

  // Only admins can update predictions
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update predictions');
  }

  // Update allowed fields
  const allowedUpdates = ['propertyData', 'predictedPrice', 'priceInMillions'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedPrediction = await Prediction.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('user', 'name email role');

  res.json({
    status: 'success',
    message: 'Prediction updated successfully',
    data: updatedPrediction,
  });
});

// @desc    Delete a prediction
// @route   DELETE /api/predict/:id
// @access  Private
const deletePrediction = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findById(req.params.id);

  if (!prediction) {
    res.status(404);
    throw new Error('Prediction not found');
  }

  // Check ownership
  if (prediction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this prediction');
  }

  await prediction.deleteOne();

  res.json({
    status: 'success',
    message: 'Prediction deleted',
  });
});

// @desc    Delete multiple predictions (Admin only)
// @route   POST /api/predict/delete-multiple
// @access  Private/Admin
const deleteMultiplePredictions = asyncHandler(async (req, res) => {
  const { predictionIds } = req.body;

  if (!predictionIds || !Array.isArray(predictionIds) || predictionIds.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of prediction IDs');
  }

  const result = await Prediction.deleteMany({
    _id: { $in: predictionIds }
  });

  res.json({
    status: 'success',
    message: `${result.deletedCount} predictions deleted`,
    deletedCount: result.deletedCount,
  });
});

// @desc    Get prediction statistics (Admin only)
// @route   GET /api/predict/stats
// @access  Private/Admin
const getPredictionStats = asyncHandler(async (req, res) => {
  const totalPredictions = await Prediction.countDocuments();
  
  // Get predictions by date range
  const today = new Date();
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const predictionsLast7Days = await Prediction.countDocuments({
    createdAt: { $gte: last7Days }
  });

  const predictionsLast30Days = await Prediction.countDocuments({
    createdAt: { $gte: last30Days }
  });

  // Get average price
  const avgPriceResult = await Prediction.aggregate([
    {
      $group: {
        _id: null,
        avgPrice: { $avg: '$predictedPrice' },
        maxPrice: { $max: '$predictedPrice' },
        minPrice: { $min: '$predictedPrice' }
      }
    }
  ]);

  const priceStats = avgPriceResult.length > 0 ? avgPriceResult[0] : {
    avgPrice: 0,
    maxPrice: 0,
    minPrice: 0
  };

  // Get top districts
  const topDistricts = await Prediction.aggregate([
    {
      $group: {
        _id: '$propertyData.district_name',
        count: { $sum: 1 },
        avgPrice: { $avg: '$predictedPrice' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // Get unique users count
  const uniqueUsers = await Prediction.distinct('user');

  res.json({
    status: 'success',
    data: {
      totalPredictions,
      predictionsLast7Days,
      predictionsLast30Days,
      uniqueUsers: uniqueUsers.length,
      priceStatistics: {
        average: priceStats.avgPrice,
        max: priceStats.maxPrice,
        min: priceStats.minPrice,
      },
      topDistricts,
    },
  });
});

module.exports = {
  makePrediction,
  getPredictionHistory,
  getAllPredictions,
  getPredictionById,
  updatePrediction,
  deletePrediction,
  deleteMultiplePredictions,
  getPredictionStats,
};
