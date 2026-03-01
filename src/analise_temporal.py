import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv(
    "data/unificado/gastos_unificados.csv",
    parse_dates=["data_hora"]
)

df["data"] = df["data_hora"].dt.date
df["hora"] = df["data_hora"].dt.hour

gastos_por_dia = df.groupby("data")["valor"].sum()

plt.figure()
gastos_por_dia.plot(marker="o")
plt.title("Gasto total por dia")
plt.xlabel("Data")
plt.ylabel("Valor gasto")
plt.tight_layout()
plt.show()

dias_disponiveis = list(gastos_por_dia.index)

print("\n=== DIAS DISPONÍVEIS ===")
for i, dia in enumerate(dias_disponiveis, start=1):
    print(f"[{i:02d}] {dia.strftime('%d/%m/%Y')}")

opcao = int(input("\nEscolha o número do dia: "))

if opcao < 1 or opcao > len(dias_disponiveis):
    raise ValueError("Opção inválida.")

dia_escolhido = dias_disponiveis[opcao - 1]

df_dia = df[df["data"] == dia_escolhido]

gastos_por_hora = df_dia.groupby("hora")["valor"].sum()

plt.figure()
gastos_por_hora.plot(kind="bar")
plt.title(f"Gastos por hora em {dia_escolhido.strftime('%d/%m/%Y')}")
plt.xlabel("Hora do dia")
plt.ylabel("Valor gasto")
plt.tight_layout()
plt.show()

print("\n=== INSIGHTS ===")
print(f"Dia analisado: {dia_escolhido.strftime('%d/%m/%Y')}")
print(f"Total gasto no dia: {gastos_por_dia[dia_escolhido]:.2f}")

hora_pico = gastos_por_hora.idxmax()
print(f"Horário de maior gasto: {hora_pico}h")

input("\nPressione ENTER para finalizar...")