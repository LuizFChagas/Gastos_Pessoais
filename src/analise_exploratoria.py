import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv(
    "data/processed/gastos_processados.csv",
    parse_dates=["data"]
)

print("\n=== INFO ===")
print(df.info())

print("\n=== DESCRIBE ===")
print(df.describe())

print("\n=== ESTATÍSTICAS ===")
print(f"Gasto total: {df['valor'].sum():.2f}")
print(f"Gasto médio: {df['valor'].mean():.2f}")
print(f"Maior gasto: {df['valor'].max():.2f}")
print(f"Menor gasto: {df['valor'].min():.2f}")

gastos_categoria = (
    df.groupby("categoria")["valor"]
    .sum()
    .sort_values(ascending=False)
)

print("\n=== GASTOS POR CATEGORIA ===")
print(gastos_categoria)

plt.figure()
gastos_categoria.plot(kind="bar")
plt.title("Gastos por Categoria")
plt.xlabel("Categoria")
plt.ylabel("Valor gasto")
plt.tight_layout()
plt.show()

gastos_tempo = (
    df.groupby("data")["valor"]
    .sum()
)

plt.figure()
gastos_tempo.plot()
plt.title("Gastos ao Longo do Tempo")
plt.xlabel("Data")
plt.ylabel("Valor gasto")
plt.tight_layout()
plt.show()

categoria_maior_gasto = gastos_categoria.idxmax()
valor_maior_gasto = gastos_categoria.max()

print("\n=== INSIGHTS ===")
print(
    f"A categoria com maior gasto foi "
    f"'{categoria_maior_gasto}', "
    f"totalizando {valor_maior_gasto:.2f}"
)

print("\nAnálise exploratória concluída!")

input("\nPressione ENTER para finalizar...")