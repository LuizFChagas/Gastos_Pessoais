import pandas as pd
from pathlib import Path

CAMINHO_UNIFICADO = Path("data/unificado/gastos_unificados.csv")
COLUNAS = ["data_hora", "descricao", "valor", "categoria", "origem"]

REGRAS_CATEGORIA = {
    "ifood": "alimentacao",
    "padaria": "alimentacao",
    "supermercado": "alimentacao",
    "uber": "transporte",
    "99": "transporte",
    "netflix": "lazer",
    "spotify": "lazer",
    "aluguel": "moradia"
}


def garantir_base_unificada():
    CAMINHO_UNIFICADO.parent.mkdir(parents=True, exist_ok=True)
    if not CAMINHO_UNIFICADO.exists():
        pd.DataFrame(columns=COLUNAS).to_csv(CAMINHO_UNIFICADO, index=False)


def categorizar(descricao: str) -> str:
    desc = descricao.lower()
    for chave, categoria in REGRAS_CATEGORIA.items():
        if chave in desc:
            return categoria
    return "outros"


def importar_extrato(caminho_extrato: Path):
    garantir_base_unificada()

    df_extrato = pd.read_csv(caminho_extrato, parse_dates=["data_hora"])

    df_extrato["valor"] = df_extrato["valor"].abs()

    df_extrato["categoria"] = df_extrato["descricao"].apply(categorizar)
    df_extrato["origem"] = "extrato"

    df_final = df_extrato[COLUNAS]

    df_base = pd.read_csv(CAMINHO_UNIFICADO)

    df_consolidado = pd.concat([df_base, df_final], ignore_index=True)

    df_consolidado.to_csv(CAMINHO_UNIFICADO, index=False)

    print("Extrato importado com sucesso!")
    print(df_final)


if __name__ == "__main__":
    importar_extrato(Path("data/extratos/extrato_exemplo.csv"))

