import pandas as pd

def preprocessar_gastos(df: pd.DataFrame) -> pd.DataFrame:

    df["data"] = pd.to_datetime(df["data"], errors="coerce")
    df["valor"] = pd.to_numeric(df["valor"], errors="coerce")

    df = df.dropna(subset=["data", "valor"])

    df["categoria"] = (
        df["categoria"]
        .str.strip()
        .str.lower()
    )

    df = df[df["valor"] > 0]

    return df


if __name__ == "__main__":
    df = pd.read_csv("data/gastos.csv")
    df_limpo = preprocessar_gastos(df)

    df_limpo.to_csv(
        "data/processed/gastos_processados.csv",
        index=False
    )

    print("Preprocessamento concluído!")
    print(df_limpo.head())