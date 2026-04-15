import { PieChart, Pie, Cell, Sector } from "recharts";
import { useState } from "react";
import { getCategoriaStyle, capitalizar } from "../../utils/categorias";

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 4}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      opacity={1}
    />
  );
};

function ExpensesByCategoryChart({ data, isMobile = false }) {
  const [activeIndex, setActiveIndex] = useState(null);

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

  dadosFiltrados.sort((a, b) => {
    if (a.name === "outros") return 1;
    if (b.name === "outros") return -1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  const total = dadosFiltrados.reduce((acc, item) => acc + item.value, 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div style={{
      backgroundColor: "var(--card)",
      padding: "20px",
      borderRadius: "16px",
      minHeight: isMobile ? "auto" : "350px",
      height: isMobile ? "auto" : "359px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "var(--shadow-md)"
    }}>
      <h3 style={{ color: "var(--text)", margin: "0 0 12px 0" }}>Gastos por Categoria</h3>

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
          alignItems: isMobile ? "center" : "center",
          justifyContent: isMobile ? "center" : "flex-start",
          flexDirection: isMobile ? "column" : "row",
          flex: 1,
          gap: isMobile ? "12px" : 0
        }}>
          {/* Donut chart com total no centro */}
          <div style={{ position: "relative", width: isMobile ? 180 : 220, height: isMobile ? 180 : 220, flexShrink: 0 }}>
            <PieChart width={isMobile ? 180 : 220} height={isMobile ? 180 : 220}>
              <Pie
                data={dadosFiltrados}
                dataKey="value"
                innerRadius={isMobile ? 46 : 58}
                outerRadius={isMobile ? 72 : 90}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                strokeWidth={0}
                animationBegin={0}
                animationDuration={600}
              >
                {dadosFiltrados.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={getCategoriaStyle(entry.name).chartColor}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                  />
                ))}
              </Pie>
            </PieChart>

            {/* Total no centro do donut */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none"
            }}>
              {activeIndex !== null ? (
                <>
                  <div style={{
                    color: getCategoriaStyle(dadosFiltrados[activeIndex].name).chartColor,
                    fontSize: "13px",
                    fontWeight: "700",
                    lineHeight: 1.2
                  }}>
                    {((dadosFiltrados[activeIndex].value / total) * 100).toFixed(1)}%
                  </div>
                  <div style={{ color: "var(--subtext)", fontSize: "10px", marginTop: "2px" }}>
                    {capitalizar(dadosFiltrados[activeIndex].name)}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: "var(--text)", fontSize: "12px", fontWeight: "700", lineHeight: 1.2 }}>
                    {formatCurrency(total)}
                  </div>
                  <div style={{ color: "var(--subtext)", fontSize: "10px", marginTop: "2px" }}>
                    total
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Legenda */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flex: 1,
            alignItems: "center",
            width: isMobile ? "100%" : "auto"
          }}>
            {dadosFiltrados.map((item, index) => {
              const style = getCategoriaStyle(item.name);
              const pct = ((item.value / total) * 100).toFixed(1);
              const isActive = activeIndex === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: isMobile ? "100%" : "240px",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    backgroundColor: isActive ? "rgba(255,255,255,0.06)" : "transparent"
                  }}
                >
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: style.chartColor,
                    flexShrink: 0,
                    transition: "transform 0.15s",
                    transform: isActive ? "scale(1.4)" : "scale(1)"
                  }} />
                  <span style={{ fontSize: "13px", width: "20px", flexShrink: 0 }}>
                    {style.icon}
                  </span>
                  <span style={{
                    color: "var(--text)",
                    fontSize: "13px",
                    width: "90px",
                    flexShrink: 0,
                    fontWeight: isActive ? "600" : "400",
                    transition: "font-weight 0.1s"
                  }}>
                    {capitalizar(item.name)}
                  </span>
                  <span style={{
                    color: style.chartColor,
                    fontSize: "12px",
                    fontWeight: "600",
                    textAlign: "right",
                    flex: 1
                  }}>
                    {formatCurrency(item.value)}
                  </span>
                  <span style={{
                    color: "var(--subtext)",
                    fontSize: "11px",
                    width: "36px",
                    textAlign: "right",
                    flexShrink: 0
                  }}>
                    {pct}%
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
