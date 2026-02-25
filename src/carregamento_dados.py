import pandas as pd

def carregar_gastos(caminho: str) -> pd.DataFrame:
    """
    Carrega os dados de gastos a partir de um arquivo CSV.
    """
    df = pd.read_csv(caminho, parse_dates=["data"])
    return df

if __name__ == "__main__":
    df = carregar_gastos("data/gastos.csv")
    print(df.head())