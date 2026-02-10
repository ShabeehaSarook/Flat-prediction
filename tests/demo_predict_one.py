import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model_pipeline.pkl")
DATA_PATH = os.path.join(BASE_DIR, "data", "data.csv")

print("=" * 70)
print("✅ DEMO: PREDICT ONE PROPERTY")
print("=" * 70)

model = joblib.load(MODEL_PATH)
df = pd.read_csv(DATA_PATH)

# Take one sample row from dataset (drop target)
sample = df.drop(columns=["price"]).iloc[[0]].copy()

# IMPORTANT: remove "index" because training dropped it
if "index" in sample.columns:
    sample = sample.drop(columns=["index"])

print("✅ Sample input row (1 property):")
print(sample.to_string(index=False))

pred = model.predict(sample)[0]
print("\n✅ Predicted price:", float(pred))

print("\n✅ Viva explanation:")
print("- This demo predicts for one input property.")
print("- Uses saved pipeline so preprocessing + model are applied automatically.")
print("=" * 70)
