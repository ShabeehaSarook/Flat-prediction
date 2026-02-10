import pandas as pd

df = pd.read_csv("data/data.csv")

print("First 5 rows:")
print(df.head())

print("\nDataset shape:")
print(df.shape)

print("\nColumn names:")
print(list(df.columns))

print("\nMissing values:")
print(df.isna().sum())

print("\nData types:")
print(df.dtypes)

print("\nStatistical summary:")
print(df.describe(include="all"))
