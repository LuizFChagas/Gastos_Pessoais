import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function ExpensesByCategoryChart({ data }) {

  const dadosFiltrados = data
    .filter(g => g.tipo === "saida")
    .reduce((acc, item) => {
      const categoria = item.categoria || "outros";
      const existente = acc.find(i => i.name === categoria);

      if (existente) {
        existente.value += item.valor;
      } else {
        acc.push({ name: categoria, value: item.valor });
      }

      return acc;
    }, []);

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        padding: "20px",
        borderRadius: "12px"
      }}
    >
      <h3 style={{ color: "var(--text)" }}>Gastos por Categoria</h3>

      <PieChart width={400} height={300}>
        <Pie
          data={dadosFiltrados}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
        >
          {dadosFiltrados.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        <Tooltip />
        <Legend wrapperStyle={{ color: "var(--text)" }} />
      </PieChart>
    </div>
  );
}

export default ExpensesByCategoryChart;