import os
import pandas as pd
import numpy as np

from sklearn.model_selection import KFold, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "data.csv")

print("=" * 70)
print("✅ CROSS VALIDATION (5-FOLD) - REAL ESTATE PRICE PREDICTION")
print("=" * 70)
print("✅ Loading:", DATA_PATH)

df = pd.read_csv(DATA_PATH)
TARGET = "price"

X = df.drop(columns=[TARGET, "index"])
y = df[TARGET]

# Detect column types
cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
num_cols = [c for c in X.columns if c not in cat_cols]

numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median"))
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])

preprocess = ColumnTransformer(
    transformers=[
        ("num", numeric_transformer, num_cols),
        ("cat", categorical_transformer, cat_cols)
    ]
)

model = RandomForestRegressor(
    n_estimators=400,
    random_state=42,
    n_jobs=-1
)

pipeline = Pipeline(steps=[
    ("preprocess", preprocess),
    ("model", model)
])

# 5-Fold CV
kf = KFold(n_splits=5, shuffle=True, random_state=42)

print("\n⏳ Running 5-Fold Cross Validation...")

mae_scores = -cross_val_score(
    pipeline, X, y, cv=kf,
    scoring="neg_mean_absolute_error",
    n_jobs=-1
)

rmse_scores = np.sqrt(-cross_val_score(
    pipeline, X, y, cv=kf,
    scoring="neg_mean_squared_error",
    n_jobs=-1
))

r2_scores = cross_val_score(
    pipeline, X, y, cv=kf,
    scoring="r2",
    n_jobs=-1
)

print("\n✅ CV RESULTS (5 folds)")
print(f"MAE : mean={mae_scores.mean():.3f}, std={mae_scores.std():.3f}")
print(f"RMSE: mean={rmse_scores.mean():.3f}, std={rmse_scores.std():.3f}")
print(f"R²  : mean={r2_scores.mean():.6f}, std={r2_scores.std():.6f}")

print("\n✅ Explanation for viva:")
print("- Cross-validation evaluates the model on 5 different splits.")
print("- This checks generalization and reduces overfitting risk.")
print("=" * 70)
