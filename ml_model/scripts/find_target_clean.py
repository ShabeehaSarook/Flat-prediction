import pandas as pd

train_df = pd.read_csv("data/data.csv")
test_df = pd.read_csv("data/test.csv")

target_cols = [c for c in train_df.columns if c not in test_df.columns]
print("Target column found:", target_cols)

if target_cols:
    TARGET = target_cols[0]
    print(f"\nTarget: {TARGET}")
    print(f"Data type: {train_df[TARGET].dtype}")
    print(f"Unique values: {train_df[TARGET].nunique()}")
    print(f"Sample values: {train_df[TARGET].head().tolist()}")
else:
    print("No target column found.")
