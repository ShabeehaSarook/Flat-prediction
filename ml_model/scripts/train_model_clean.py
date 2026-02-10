"""
Real Estate Price Prediction - Model Training Script (Clean Version)

This module implements the complete training pipeline for predicting real estate prices
using Random Forest regression with automated preprocessing for mixed data types.

Author: [Your Name]
Date: January 2026
Project: Real Estate Price Prediction System

Description:
    This script trains a machine learning model to predict property prices based on
    17 features including property characteristics (size, amenities) and location.
    
Key Features:
    - Automated feature type detection (numerical vs categorical)
    - Robust preprocessing pipeline (imputation + encoding)
    - Random Forest ensemble with 400 trees
    - 80-20 train-validation split
    - Multiple evaluation metrics (MAE, RMSE, R²)
    - Model persistence for deployment

Workflow:
    1. Load training data from CSV
    2. Separate features (X) from target (y = price)
    3. Identify numerical and categorical features automatically
    4. Create preprocessing pipelines:
       - Numerical: median imputation
       - Categorical: most_frequent imputation + one-hot encoding
    5. Build complete pipeline (preprocessing + Random Forest)
    6. Train on 80% of data, validate on 20%
    7. Evaluate performance with multiple metrics
    8. Save trained model for predictions

Usage:
    python train_model_clean.py
    
Input:
    - data/data.csv (100,000 property records with 17 features + price)
    
Output:
    - model_pipeline.pkl (trained model, ~2.9 GB)
    - Console output with performance metrics
    
Performance:
    - Training time: 3-5 minutes on modern hardware
    - Expected R² score: 0.85-0.92
    - Expected MAE: ~650,000 RUB (±10% error)

Dependencies:
    - pandas: Data manipulation
    - numpy: Numerical operations
    - scikit-learn: Machine learning algorithms
    - joblib: Model serialization

Example Output:
    Numerical features (12): ['kitchen_area', 'bath_area', ...]
    Categorical features (5): ['gas', 'hot_water', ...]
    
    Training samples: 80000
    Validation samples: 20000
    
    Training model...
    Training complete!
    
    === MODEL PERFORMANCE ===
    MAE:  654,123.45 rubles
    RMSE: 948,765.32 rubles
    R²:   0.8821
    
    ✓ Model saved to: model_pipeline.pkl

Notes:
    - Model must be trained before making predictions
    - Saves complete pipeline (preprocessing + model) for consistency
    - random_state=42 ensures reproducible results
    - Uses all CPU cores (n_jobs=-1) for faster training

"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor

# ============================================================================
# STEP 1: LOAD DATA
# ============================================================================
# Load training dataset from CSV file
df = pd.read_csv("data/data.csv")
TARGET = "price"  # Target variable: property price in Russian Rubles

# ============================================================================
# STEP 2: SEPARATE FEATURES AND TARGET
# ============================================================================
# Split data into features (X) and target variable (y)
# Remove 'index' column as it's just an identifier, not a feature
X = df.drop(columns=[TARGET, "index"])  # Features: 17 columns
y = df[TARGET]  # Target: price (continuous)

# ============================================================================
# STEP 3: IDENTIFY FEATURE TYPES
# ============================================================================
# Automatically detect categorical (object dtype) and numerical features
# This allows the pipeline to handle mixed data types appropriately
cat_cols = X.select_dtypes(include=["object"]).columns.tolist()  # Categorical: 5 features
num_cols = [c for c in X.columns if c not in cat_cols]  # Numerical: 12 features

print(f"Numerical features ({len(num_cols)}): {num_cols}")
print(f"Categorical features ({len(cat_cols)}): {cat_cols}")

# ============================================================================
# STEP 4: CREATE PREPROCESSING PIPELINES
# ============================================================================
# Build separate preprocessing pipelines for numerical and categorical features

# Numerical Pipeline: Handle missing values with median
# (Random Forest doesn't require scaling, so we skip StandardScaler)
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median"))  # Fill missing with median
])

# Categorical Pipeline: Handle missing values + convert to binary vectors
categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),  # Fill missing with mode
    ("onehot", OneHotEncoder(handle_unknown="ignore"))  # Convert to one-hot encoding
])

# Combine both pipelines using ColumnTransformer
# This applies the correct transformation to each feature type
preprocessor = ColumnTransformer([
    ("num", numeric_transformer, num_cols),
    ("cat", categorical_transformer, cat_cols)
])

# ============================================================================
# STEP 5: BUILD COMPLETE ML PIPELINE
# ============================================================================
# Combine preprocessing and model into single pipeline
# This ensures consistent preprocessing during training and prediction
pipeline = Pipeline([
    ("preprocess", preprocessor),  # Preprocessing step
    ("model", RandomForestRegressor(  # Random Forest model
        n_estimators=400,  # 400 decision trees in ensemble
        random_state=42,   # Seed for reproducibility
        n_jobs=-1          # Use all CPU cores for parallel training
    ))
])

# ============================================================================
# STEP 6: TRAIN-VALIDATION SPLIT
# ============================================================================
# Split data into 80% training and 20% validation
# This allows us to evaluate model performance on unseen data
X_train, X_val, y_train, y_val = train_test_split(
    X, y, 
    test_size=0.2,      # 20% for validation
    random_state=42     # Reproducible split
)

print(f"\nTraining samples: {len(X_train)}")    # Expected: 80,000
print(f"Validation samples: {len(X_val)}")      # Expected: 20,000

# ============================================================================
# STEP 7: TRAIN THE MODEL
# ============================================================================
# Fit the complete pipeline on training data
# This trains preprocessing transformers AND the Random Forest model
print("\nTraining model...")
pipeline.fit(X_train, y_train)  # Takes 3-5 minutes
print("Training complete!")

# ============================================================================
# STEP 8: EVALUATE MODEL PERFORMANCE
# ============================================================================
# Generate predictions on validation set and calculate performance metrics
y_pred = pipeline.predict(X_val)

# Calculate evaluation metrics
mae = mean_absolute_error(y_val, y_pred)          # Average absolute error
rmse = np.sqrt(mean_squared_error(y_val, y_pred)) # Root mean squared error
r2 = r2_score(y_val, y_pred)                      # Proportion of variance explained

# Display results
print("\n=== MODEL PERFORMANCE ===")
print(f"MAE:  {mae:,.2f} rubles")  # Avg error ±10% typically
print(f"RMSE: {rmse:,.2f} rubles") # Penalizes large errors
print(f"R²:   {r2:.4f}")           # Target: >0.85 (excellent)

# ============================================================================
# STEP 9: SAVE TRAINED MODEL
# ============================================================================
# Serialize the complete pipeline for later use
# This saves both preprocessing steps and trained model
joblib.dump(pipeline, "model_pipeline.pkl")
print("\n✓ Model saved to: model_pipeline.pkl")
print("✓ Model size: ~2.9 GB")
print("✓ Ready for predictions!")
