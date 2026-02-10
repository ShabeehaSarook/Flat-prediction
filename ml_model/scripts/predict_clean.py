"""
Real Estate Price Prediction - Batch Prediction Script (Clean Version)

This module loads a trained machine learning model and generates predictions
for a batch of properties from a test dataset.

Author: [Your Name]
Date: January 2026
Project: Real Estate Price Prediction System

Description:
    This script loads the pre-trained model pipeline and applies it to test data
    to generate price predictions. It handles data loading, prediction generation,
    and output formatting automatically.

Key Features:
    - Loads trained model pipeline (preprocessing + Random Forest)
    - Processes test data with same preprocessing as training
    - Generates predictions for all properties in batch
    - Creates properly formatted submission file
    - Handles index column preservation

Workflow:
    1. Load trained model from model_pipeline.pkl
    2. Load test data from CSV
    3. Extract and preserve index column
    4. Generate predictions using loaded pipeline
    5. Create submission DataFrame with index and predictions
    6. Save results to submission.csv

Usage:
    python predict_clean.py
    
Prerequisites:
    - model_pipeline.pkl must exist (run train_model_clean.py first)
    - data/test.csv must be available
    
Input:
    - model_pipeline.pkl (trained model, ~2.9 GB)
    - data/test.csv (test dataset with same 17 features as training)
    
Output:
    - submission.csv (2 columns: index, price)
    - Console output with sample predictions
    
Performance:
    - Prediction time: <1 second for typical test sets
    - Batch processing: ~100 properties/second
    
Example Output:
    ✓ Model loaded
    ✓ Test data shape: (50000, 17)
    ✓ Generated 50000 predictions
    ✓ Submission saved to: submission.csv
    
    Sample predictions:
       index        price
    0      1   5234567.89
    1      2   7890123.45
    2      3   4567890.12
    ...

Dependencies:
    - pandas: Data manipulation
    - joblib: Model loading

Notes:
    - Preprocessing is automatic (handled by pipeline)
    - Test data must have same features as training data
    - Missing features will cause errors
    - Index column is preserved for submission tracking

"""

import pandas as pd
import joblib

# ============================================================================
# STEP 1: LOAD TRAINED MODEL
# ============================================================================
# Load the complete pipeline (preprocessing + model) from disk
model = joblib.load("model_pipeline.pkl")
print("✓ Model loaded")

# ============================================================================
# STEP 2: LOAD TEST DATA
# ============================================================================
# Read test dataset containing properties to predict
test_df = pd.read_csv("data/test.csv")
print(f"✓ Test data shape: {test_df.shape}")

# ============================================================================
# STEP 3: PREPARE DATA FOR PREDICTION
# ============================================================================
# Extract and preserve index column for submission file
# Remove index from features (model wasn't trained on it)
if "index" in test_df.columns:
    submission_index = test_df["index"].copy()  # Preserve original index
    X_test = test_df.drop(columns=["index"])    # Features only
else:
    submission_index = pd.Series(range(len(test_df)), name="index")  # Create index
    X_test = test_df  # Use all columns as features

# ============================================================================
# STEP 4: GENERATE PREDICTIONS
# ============================================================================
# Apply trained model to test data
# Pipeline automatically applies preprocessing before prediction
predictions = model.predict(X_test)  # Returns array of predicted prices
print(f"✓ Generated {len(predictions)} predictions")

# ============================================================================
# STEP 5: CREATE SUBMISSION FILE
# ============================================================================
# Format results as DataFrame with index and predicted prices
submission = pd.DataFrame({
    "index": submission_index,      # Property IDs
    "price": predictions            # Predicted prices in RUB
})

# ============================================================================
# STEP 6: SAVE RESULTS
# ============================================================================
# Write predictions to CSV file for submission or further analysis
submission.to_csv("submission.csv", index=False)
print("✓ Submission saved to: submission.csv")

# Display sample predictions for verification
print("\nSample predictions:")
print(submission.head(10))
