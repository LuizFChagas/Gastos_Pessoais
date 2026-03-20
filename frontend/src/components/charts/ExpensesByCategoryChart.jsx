import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";
import { gastosPorCategoria } from "../../api/gastosApi";

const COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];

function ExpensesByCategoryChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const response = await gastosPorCategoria();

      const formatado = response.map((item) => ({
        name: item.categoria,
        value: item.total
      }));

      setData(formatado);

    } catch (error) {
      console.error("Erro ao carregar gráfico:", error);
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Gastos por Categoria</h2>

      <PieChart width={400} height={300}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
        >
          {data.map((entry, index) => (
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