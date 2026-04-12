import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { getCategoriaStyle, capitalizar } from "../../utils/categorias";

function ExpensesByCategoryChart({ data }) {

  const dadosFiltrados = data
    .filter(g => g.tipo === "saida")
    .reduce((acc, item) => {
      const categoria = (item.categoria || "outros").toLowerCase();
      const existente = acc.find(i => i.name === categoria);

      if (existente) {
        existente.value += item.valor;
      } else {
        acc.push({ name: categoria, value: item.valor });
      }

      return acc;
    }, []);

  const total = dadosFiltrados.reduce((acc, item) => acc + item.value, 0);

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
          <PieChart width={220} height={220}>
            <Pie data={dadosFiltrados} dataKey="value" outerRadius={90}>
              {dadosFiltrados.map((entry, index) => (
                <Cell key={index} fill={getCategoriaStyle(entry.name).chartColor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const pct = ((value / total) * 100).toFixed(1);
                return [`${pct}%`, ""];
              }}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                color: "#fff",
                borderRadius: "8px"
              }}
            />
          </PieChart>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            minWidth: "170px",
            maxHeight: "280px",
            overflowY: "auto"
          }}>
            {dadosFiltrados.map((item, index) => {
              const style = getCategoriaStyle(item.name);
              return (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: style.chartColor,
                    flexShrink: 0
                  }} />
                  <span style={{ color: "var(--text)", fontSize: "13px" }}>
                    {style.icon} {capitalizar(item.name)}
                  </span>
                  <span style={{
                    marginLeft: "auto",
                    color: style.chartColor,
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    }).format(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesByCategoryChart;
