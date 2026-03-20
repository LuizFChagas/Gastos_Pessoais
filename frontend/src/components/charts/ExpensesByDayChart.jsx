import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";
import { gastosPorDia } from "../../api/gastosApi";

function ExpensesByDayChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const response = await gastosPorDia();

      const formatado = response.map((item) => ({
        dia: item.dia,
        total: item.total
      }));

      setData(formatado);

    } catch (error) {
      console.error("Erro ao carregar gráfico por dia:", error);
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Gastos por Dia</h2>

      <LineChart width={500} height={300} data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="dia" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#3b82f6" />
      </LineChart>
    </div>
  );
}

export default ExpensesByDayChart;