import pandas as pd
from datetime import datetime
from pathlib import Path

CAMINHO_UNIFICADO = Path("data/unificado/gastos_unificados.csv")

def adicionar_gasto_manual(
    descricao: str,
    valor: float,
    categoria: str
):
    novo_gasto = {
        "data_hora": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "descricao": descricao,
        "valor": valor,
        "categoria": categoria,
        "origem": "manual"
    }

    df_novo = pd.DataFrame([novo_gasto])

    df_existente = pd.read_csv(CAMINHO_UNIFICADO)

    df_final = pd.concat([df_existente, df_novo], ignore_index=True)

    df_final.to_csv(CAMINHO_UNIFICADO, index=False)

    print("Gasto manual adicionado com sucesso!")
    print(df_novo)


if __name__ == "__main__":
    adicionar_gasto_manual(
        descricao="Padaria",
        valor=15.90,
        categoria="alimentacao"
    )