import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

function ExpensesByDayChart({ data }) {

  // ✅ FILTRA SOMENTE SAÍDAS
  const saidas = data.filter(g => g.tipo === "saida");

  // ✅ AGRUPA POR DIA
  const agrupado = saidas.reduce((acc, item) => {
    const dia = item.data_hora.split("T")[0];

    if (!acc[dia]) {
      acc[dia] = 0;
    }

    acc[dia] += item.valor;

    return acc;
  }, {});

  // ✅ ORDENA E FORMATA SEM QUEBRAR DATA
  const chartData = Object.keys(agrupado)
    .sort((a, b) => new Date(a) - new Date(b)) // só usa Date pra ordenar
    .map((dia) => {
      const [ano, mes, diaNum] = dia.split("-");

      return {
        dia: `${diaNum}/${mes}/${ano}`, // 🔥 sem timezone bug
        total: agrupado[dia]
      };
    });

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px"
      }}
    >
      <h3>Gastos por Dia</h3>

      <LineChart width={500} height={300} data={chartData}>
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