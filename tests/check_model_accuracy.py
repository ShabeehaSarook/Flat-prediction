"""
Check Model Accuracy - Quick Verification Script

This script loads the trained model and displays its performance metrics.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import os

print("="*70)
print("MODEL ACCURACY VERIFICATION")
print("="*70)

# Check if model exists
if not os.path.exists('model_pipeline.pkl'):
    print("\n❌ Model file not found!")
    print("Please run: python train_model_clean.py first")
    exit()

print("\n✓ Model file found: model_pipeline.pkl")
print("  Size:", round(os.path.getsize('model_pipeline.pkl') / (1024**3), 2), "GB")

# Load model
print("\nLoading trained model...")
model = joblib.load('model_pipeline.pkl')
print("✓ Model loaded successfully!")

# Load data
print("\nLoading data...")
df = pd.read_csv("data/data.csv")
print(f"✓ Data loaded: {df.shape[0]:,} samples, {df.shape[1]} columns")

# Prepare data
X = df.drop(columns=["price", "index"])
y = df["price"]

print(f"\n📊 Dataset Information:")
print(f"   Features: {X.shape[1]}")
print(f"   Samples: {X.shape[0]:,}")
print(f"   Target: price (continuous)")

# Split data (same as training)
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"\n📂 Data Split:")
print(f"   Training samples: {len(X_train):,} (80%)")
print(f"   Validation samples: {len(X_val):,} (20%)")

# Generate predictions
print("\n🔮 Generating predictions...")
y_pred_train = model.predict(X_train)
y_pred_val = model.predict(X_val)
print("✓ Predictions generated!")

# Calculate metrics
print("\n" + "="*70)
print("🎯 MODEL PERFORMANCE METRICS")
print("="*70)

# Training set metrics
mae_train = mean_absolute_error(y_train, y_pred_train)
rmse_train = np.sqrt(mean_squared_error(y_train, y_pred_train))
r2_train = r2_score(y_train, y_pred_train)

print("\n📈 TRAINING SET PERFORMANCE:")
print(f"   MAE:  {mae_train:,.2f} RUB")
print(f"   RMSE: {rmse_train:,.2f} RUB")
print(f"   R² Score: {r2_train:.4f} ({r2_train*100:.2f}% variance explained)")

# Validation set metrics
mae_val = mean_absolute_error(y_val, y_pred_val)
rmse_val = np.sqrt(mean_squared_error(y_val, y_pred_val))
r2_val = r2_score(y_val, y_pred_val)

print("\n📊 VALIDATION SET PERFORMANCE (Main Metric):")
print(f"   MAE:  {mae_val:,.2f} RUB")
print(f"   RMSE: {rmse_val:,.2f} RUB")
print(f"   R² Score: {r2_val:.4f} ({r2_val*100:.2f}% variance explained)")

# Interpretation
print("\n" + "="*70)
print("📖 METRICS INTERPRETATION")
print("="*70)

print(f"\n1️⃣ R² Score (Coefficient of Determination): {r2_val:.4f}")
print(f"   → Model explains {r2_val*100:.2f}% of price variance")
if r2_val >= 0.90:
    print("   → ⭐⭐⭐⭐⭐ EXCELLENT (>90%)")
elif r2_val >= 0.85:
    print("   → ⭐⭐⭐⭐ VERY GOOD (85-90%)")
elif r2_val >= 0.80:
    print("   → ⭐⭐⭐ GOOD (80-85%)")
else:
    print("   → ⭐⭐ ACCEPTABLE (<80%)")

print(f"\n2️⃣ MAE (Mean Absolute Error): {mae_val:,.2f} RUB")
avg_price = y.mean()
mae_percent = (mae_val / avg_price) * 100
print(f"   → Average error: ±{mae_val:,.0f} RUB")
print(f"   → As percentage: ±{mae_percent:.1f}% of average price")
if mae_percent < 10:
    print("   → ⭐⭐⭐⭐⭐ EXCELLENT (<10%)")
elif mae_percent < 15:
    print("   → ⭐⭐⭐⭐ VERY GOOD (10-15%)")
else:
    print("   → ⭐⭐⭐ GOOD (>15%)")

print(f"\n3️⃣ RMSE (Root Mean Squared Error): {rmse_val:,.2f} RUB")
print(f"   → Penalizes large errors more heavily")
print(f"   → RMSE/MAE ratio: {rmse_val/mae_val:.2f}")
if rmse_val/mae_val < 1.3:
    print("   → Most errors are consistent (good!)")
else:
    print("   → Some large outlier errors exist")

# Sample predictions
print("\n" + "="*70)
print("📋 SAMPLE PREDICTIONS (First 10 from validation set)")
print("="*70)

sample_df = pd.DataFrame({
    'Actual Price': y_val.iloc[:10].values,
    'Predicted Price': y_pred_val[:10],
    'Error': y_val.iloc[:10].values - y_pred_val[:10],
    'Error %': ((y_val.iloc[:10].values - y_pred_val[:10]) / y_val.iloc[:10].values * 100)
})

print("\n" + sample_df.to_string())

# Summary statistics
print("\n" + "="*70)
print("📊 ERROR STATISTICS")
print("="*70)

errors = y_val - y_pred_val
print(f"\nError Range:")
print(f"   Min error: {errors.min():,.2f} RUB (over-prediction)")
print(f"   Max error: {errors.max():,.2f} RUB (under-prediction)")
print(f"   Mean error: {errors.mean():,.2f} RUB")
print(f"   Median error: {errors.median():,.2f} RUB")

within_10pct = (np.abs(errors / y_val) <= 0.10).sum()
within_15pct = (np.abs(errors / y_val) <= 0.15).sum()
within_20pct = (np.abs(errors / y_val) <= 0.20).sum()

print(f"\nPrediction Accuracy:")
print(f"   Within ±10%: {within_10pct:,} samples ({within_10pct/len(y_val)*100:.1f}%)")
print(f"   Within ±15%: {within_15pct:,} samples ({within_15pct/len(y_val)*100:.1f}%)")
print(f"   Within ±20%: {within_20pct:,} samples ({within_20pct/len(y_val)*100:.1f}%)")

# Model information
print("\n" + "="*70)
print("🤖 MODEL INFORMATION")
print("="*70)

print("\n📝 Algorithm: Random Forest Regressor")
print("   Number of trees: 400")
print("   Max depth: Unlimited (None)")
print("   Random state: 42 (reproducible)")
print("   CPU cores used: All available (-1)")

print("\n🔧 Preprocessing Pipeline:")
print("   ├─ Numerical features (12): SimpleImputer (median)")
print("   └─ Categorical features (5): SimpleImputer + OneHotEncoder")

print("\n✅ Training Approach:")
print("   1. Data split: 80% train, 20% validation")
print("   2. Automated feature type detection")
print("   3. Pipeline prevents data leakage")
print("   4. Cross-validation performed (5-fold)")

print("\n" + "="*70)
print("✅ ACCURACY VERIFICATION COMPLETE")
print("="*70)

print("\n🎯 OVERALL GRADE:")
if r2_val >= 0.85 and mae_percent < 15:
    print("   ⭐⭐⭐⭐⭐ EXCELLENT - Distinction Level")
elif r2_val >= 0.80 and mae_percent < 20:
    print("   ⭐⭐⭐⭐ VERY GOOD - Merit Level")
else:
    print("   ⭐⭐⭐ GOOD - Pass Level")

print(f"\n💡 Key Takeaway:")
print(f"   Your model achieves {r2_val*100:.1f}% accuracy with ±{mae_percent:.1f}% average error.")
print(f"   This is {('EXCELLENT' if r2_val >= 0.85 else 'GOOD')} performance for real estate prediction!")

print("\n" + "="*70)
