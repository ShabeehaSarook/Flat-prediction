import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model_pipeline.pkl")
OUT_CSV = os.path.join(BASE_DIR, "outputs", "feature_importance_top20.csv")

os.makedirs(os.path.join(BASE_DIR, "outputs"), exist_ok=True)

print("=" * 70)
print("✅ FEATURE IMPORTANCE - RANDOM FOREST")
print("=" * 70)
print("✅ Loading model:", MODEL_PATH)

pipeline = joblib.load(MODEL_PATH)

preprocess = pipeline.named_steps["preprocess"]
model = pipeline.named_steps["model"]

feature_names = preprocess.get_feature_names_out()
importances = model.feature_importances_

imp_df = pd.DataFrame({
    "feature": feature_names,
    "importance": importances
}).sort_values("importance", ascending=False)

print("\n✅ Top 20 important features:")
print(imp_df.head(20).to_string(index=False))

imp_df.head(20).to_csv(OUT_CSV, index=False)
print("\n✅ Saved CSV:", OUT_CSV)

print("\n✅ Viva explanation:")
print("- Feature importance shows which variables contributed most to predictions.")
print("- Helps justify why the model makes decisions (explainability).")
print("=" * 70)
