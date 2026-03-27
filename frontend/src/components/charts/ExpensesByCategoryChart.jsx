import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function ExpensesByCategoryChart({ data }) {

  // ✅ FILTRA APENAS SAÍDAS
  const gastosSaida = data.filter(g => g.tipo === "saida");

  // ✅ AGRUPA POR CATEGORIA
  const agrupado = gastosSaida.reduce((acc, item) => {
    const categoria = item.categoria || "outros";

    if (!acc[categoria]) {
      acc[categoria] = 0;
    }

    acc[categoria] += item.valor;

    return acc;
  }, {});

  // ✅ FORMATA PARA O GRÁFICO
  const chartData = Object.keys(agrupado).map((key) => ({
    name: key,
    value: agrupado[key]
  }));

  const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4"
  ];

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px"
      }}
    >
      <h3>Gastos por Categoria</h3>

      <PieChart width={300} height={250}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}

export default ExpensesByCategoryChart;