import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";

const COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];

function ExpensesByCategoryChart({ data }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const formatado = Object.values(
      data.reduce((acc, item) => {
        const categoria = item.categoria || "outros";

        if (!acc[categoria]) {
          acc[categoria] = { name: categoria, value: 0 };
        }

        acc[categoria].value += Math.abs(item.valor);
        return acc;
      }, {})
    );

    setChartData(formatado);
  }, [data]);

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Gastos por Categoria</h2>

      <PieChart width={400} height={300}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
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