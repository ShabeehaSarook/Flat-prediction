import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# ----------------------------
# CONFIG: adjust these if needed
# ----------------------------
DATA_PATHS_TO_TRY = [
    "data/train.csv",
    "data/train_clean.csv",
    "train.csv",
    "train_clean.csv",
]

TARGET_COL = "price"
CATEGORICAL_COLS = ["gas", "hot_water", "central_heating", "extra_area_type_name", "district_name"]

OUTPUT_DIR = "outputs_eda"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_data():
    for p in DATA_PATHS_TO_TRY:
        if os.path.exists(p):
            print(f"✅ Loaded dataset: {p}")
            return pd.read_csv(p)
    raise FileNotFoundError(
        "Could not find dataset. Put train.csv inside a data/ folder or update DATA_PATHS_TO_TRY."
    )


def save_table(df: pd.DataFrame, filename: str):
    out_path = os.path.join(OUTPUT_DIR, filename)
    df.to_csv(out_path, index=False)
    print(f"✅ Saved: {out_path}")


def main():
    df = load_data()

    # ----------------------------
    # 1) Basic dataset info
    # ----------------------------
    info = pd.DataFrame({
        "rows": [df.shape[0]],
        "columns": [df.shape[1]],
        "target_present": [TARGET_COL in df.columns],
    })
    save_table(info, "dataset_summary.csv")

    # ----------------------------
    # 2) Missing values table
    # ----------------------------
    missing = df.isna().sum().sort_values(ascending=False)
    missing_pct = (missing / len(df) * 100).round(3)
    missing_table = pd.DataFrame({
        "feature": missing.index,
        "missing_count": missing.values,
        "missing_percent": missing_pct.values
    })
    save_table(missing_table, "missing_values.csv")

    # ----------------------------
    # 3) Duplicate check
    # ----------------------------
    dup_count = df.duplicated().sum()
    dup_table = pd.DataFrame({"duplicate_rows": [int(dup_count)]})
    save_table(dup_table, "duplicates.csv")

    # ----------------------------
    # 4) Price distribution
    # ----------------------------
    if TARGET_COL in df.columns:
        price = df[TARGET_COL].dropna()

        # Histogram: raw price
        plt.figure()
        plt.hist(price, bins=50)
        plt.title("Price distribution (raw)")
        plt.xlabel("price")
        plt.ylabel("count")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, "price_hist_raw.png"), dpi=200)
        plt.close()

        # Skewness
        skew_raw = float(price.skew())
        skew_table = pd.DataFrame({"price_skewness_raw": [skew_raw]})
        save_table(skew_table, "price_skewness.csv")

        # Histogram: log1p(price)
        price_log = np.log1p(price)
        plt.figure()
        plt.hist(price_log, bins=50)
        plt.title("Price distribution (log1p)")
        plt.xlabel("log1p(price)")
        plt.ylabel("count")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, "price_hist_log1p.png"), dpi=200)
        plt.close()

    # ----------------------------
    # 5) Correlation heatmap (numerical only)
    # ----------------------------
    numeric_df = df.select_dtypes(include=[np.number]).copy()
    if TARGET_COL in numeric_df.columns:
        corr = numeric_df.corr(numeric_only=True)

        plt.figure(figsize=(10, 8))
        plt.imshow(corr.values, aspect="auto")
        plt.colorbar()
        plt.xticks(range(len(corr.columns)), corr.columns, rotation=90)
        plt.yticks(range(len(corr.columns)), corr.columns)
        plt.title("Correlation heatmap (numerical features)")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, "correlation_heatmap.png"), dpi=200)
        plt.close()

        corr_out = corr.reset_index().rename(columns={"index": "feature"})
        save_table(corr_out, "correlation_matrix.csv")

    # ----------------------------
    # 6) Categorical value counts (top districts + yes/no)
    # ----------------------------
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            vc = df[col].astype("string").fillna("Missing").value_counts().reset_index()
            vc.columns = [col, "count"]
            save_table(vc, f"value_counts_{col}.csv")

            # Plot only if not too many categories
            top = vc.head(10)
            plt.figure(figsize=(9, 4))
            plt.bar(top[col].astype(str), top["count"])
            plt.title(f"Top 10 categories: {col}")
            plt.xticks(rotation=45, ha="right")
            plt.tight_layout()
            plt.savefig(os.path.join(OUTPUT_DIR, f"top10_{col}.png"), dpi=200)
            plt.close()

    # ----------------------------
    # 7) Outlier discussion helpers (percentiles + scatter)
    # ----------------------------
    # You can change these if your dataset uses different names
    for area_col in ["total_area", "kitchen_area", "bath_area"]:
        if area_col in df.columns and TARGET_COL in df.columns:
            area = df[area_col].dropna()
            price = df[TARGET_COL].dropna()

            # Percentiles
            p = area.quantile([0.01, 0.05, 0.95, 0.99]).to_frame(name="value").reset_index()
            p.columns = ["percentile", "value"]
            save_table(p, f"percentiles_{area_col}.csv")

            # Scatter (sample if huge)
            tmp = df[[area_col, TARGET_COL]].dropna()
            if len(tmp) > 5000:
                tmp = tmp.sample(5000, random_state=42)

            plt.figure()
            plt.scatter(tmp[area_col], tmp[TARGET_COL], s=8)
            plt.title(f"{area_col} vs price (sampled)")
            plt.xlabel(area_col)
            plt.ylabel("price")
            plt.tight_layout()
            plt.savefig(os.path.join(OUTPUT_DIR, f"scatter_{area_col}_vs_price.png"), dpi=200)
            plt.close()

    print(f"\n🎉 DONE. All EDA outputs saved in: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
