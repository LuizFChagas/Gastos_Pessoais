import { PieChart, Pie, Cell, Tooltip } from "recharts";

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

  const total = dadosFiltrados.reduce((acc, item) => acc + item.value, 0);

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div style={{
      backgroundColor: "var(--card)",
      padding: "20px",
      borderRadius: "12px",
      height: "359px",
      minHeight: "350px",
      display: "flex",
      flexDirection: "column"
    }}>
      <h3 style={{ color: "var(--text)" }}>Gastos por Categoria</h3>

      {dadosFiltrados.length === 0 ? (
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--subtext)"
        }}>
          Nenhuma movimentação encontrada
        </div>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1
        }}>
          <PieChart width={250} height={250}>
            <Pie data={dadosFiltrados} dataKey="value" outerRadius={90}>
              {dadosFiltrados.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => {
                const porcentagem = ((value / total) * 100).toFixed(1);
                return `${porcentagem}%`;
              }}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                color: "#fff"
              }}
            />
          </PieChart>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minWidth: "180px"
          }}>
            {dadosFiltrados.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: "10px" }}>
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: COLORS[index % COLORS.length]
                }} />

                <span style={{ color: "var(--text)" }}>{item.name}</span>

                <span style={{
                  marginLeft: "auto",
                  color: COLORS[index % COLORS.length]
                }}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  }).format(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesByCategoryChart;