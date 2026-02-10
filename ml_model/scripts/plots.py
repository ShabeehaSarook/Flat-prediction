import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# -----------------------------
# Paths (safe)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "data.csv")
OUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUT_DIR, exist_ok=True)

# -----------------------------
# Load dataset
# -----------------------------
df = pd.read_csv(DATA_PATH)

TARGET = "price"

# Drop ID column for analysis plots where needed
if "index" in df.columns:
    df_no_id = df.drop(columns=["index"])
else:
    df_no_id = df.copy()

# Separate features/target
X = df_no_id.drop(columns=[TARGET])
y = df_no_id[TARGET]

# Identify numeric columns only
num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
cat_cols = X.select_dtypes(include=["object"]).columns.tolist()

# -----------------------------
# 1) Price distribution (Histogram)
# -----------------------------
plt.figure()
plt.hist(y, bins=50)
plt.title("Price Distribution (Histogram)")
plt.xlabel("Price")
plt.ylabel("Count")
plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "01_price_hist.png"), dpi=200)
plt.close()

# -----------------------------
# 2) Log(Price) distribution (more informative if skewed)
# -----------------------------
plt.figure()
plt.hist(np.log1p(y), bins=50)
plt.title("Log(Price + 1) Distribution")
plt.xlabel("log(price + 1)")
plt.ylabel("Count")
plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "02_log_price_hist.png"), dpi=200)
plt.close()

# -----------------------------
# 3) Scatter: Total Area vs Price (strong relationship usually)
# -----------------------------
if "total_area" in df_no_id.columns:
    plt.figure()
    plt.scatter(df_no_id["total_area"], y, s=5)  # small points
    plt.title("Total Area vs Price")
    plt.xlabel("total_area")
    plt.ylabel("price")
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "03_total_area_vs_price.png"), dpi=200)
    plt.close()

# -----------------------------
# 4) Boxplot: Price by Top 10 districts (categorical insight)
# -----------------------------
if "district_name" in df_no_id.columns:
    top_districts = df_no_id["district_name"].value_counts().head(10).index.tolist()
    filtered = df_no_id[df_no_id["district_name"].isin(top_districts)].copy()

    data_for_box = [filtered.loc[filtered["district_name"] == d, TARGET].values for d in top_districts]

    plt.figure(figsize=(10, 5))
    plt.boxplot(data_for_box, labels=top_districts, showfliers=False)
    plt.title("Price by Top 10 Districts (Boxplot)")
    plt.xlabel("district_name (Top 10)")
    plt.ylabel("price")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "04_price_by_district_boxplot.png"), dpi=200)
    plt.close()

# -----------------------------
# 5) Correlation heatmap (numeric features + price)
#    (using matplotlib only, no seaborn)
# -----------------------------
corr_df = df_no_id[num_cols + [TARGET]].corr(numeric_only=True)

plt.figure(figsize=(10, 8))
plt.imshow(corr_df.values)  # no custom color
plt.title("Correlation Heatmap (Numeric Features)")
plt.xticks(range(len(corr_df.columns)), corr_df.columns, rotation=90)
plt.yticks(range(len(corr_df.index)), corr_df.index)
plt.colorbar()
plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "05_corr_heatmap.png"), dpi=200)
plt.close()

print("✅ Saved graphs into:", OUT_DIR)
print("Files created:")
for f in sorted(os.listdir(OUT_DIR)):
    print(" -", f)
