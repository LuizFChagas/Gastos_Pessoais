import pandas as pd
from pathlib import Path

CAMINHO_UNIFICADO = Path("data/unificado/gastos_unificados.csv")

def inicializar_base():
    if not CAMINHO_UNIFICADO.exists():
        df = pd.DataFrame(
            columns=["data_hora", "descricao", "valor", "categoria", "origem"]
        )
        df.to_csv(CAMINHO_UNIFICADO, index=False)

if __name__ == "__main__":
    inicializar_base()
    print("Base unificada inicializada com sucesso.")