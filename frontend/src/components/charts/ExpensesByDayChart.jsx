import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer
} from "recharts";

import { useEffect, useState } from "react";
import { gastosPorIntervalo } from "../../api/gastosApi";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const isAnual = payload[0]?.payload?.mes !== undefined;

  const formatLabel = (val) => {
    if (isAnual) {
      const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      return meses[Number(val) - 1] || val;
    }
    const [, mes, dia] = val.split("-");
    return `${dia}/${mes}`;
  };

  return (
    <div style={{
      backgroundColor: "#1e293b",
      border: "1px solid rgba(59,246,159,0.2)",
      borderRadius: "10px",
      padding: "10px 14px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      minWidth: "130px"
    }}>
      <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "6px" }}>
        {formatLabel(label)}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.color }} />
          <span style={{ color: "#fff", fontSize: "14px", fontWeight: "700" }}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

function ExpensesByDayChart({ periodo, mesSelecionado, anoSelecionado }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    carregarDados();
  }, [periodo, mesSelecionado, anoSelecionado]);

  const getIntervalo = () => {
    const hoje = new Date();
    let inicio, fim;

    if (periodo === "semana") {
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 7);
      fim = new Date();
    }

    if (periodo === "mes") {
      const ano = anoSelecionado || hoje.getFullYear();
      const mes = mesSelecionado ?? hoje.getMonth();

      inicio = new Date(ano, mes, 1);
      fim = new Date(ano, mes + 1, 0);
    }

    if (periodo === "ano") {
      const ano = anoSelecionado || hoje.getFullYear();
      inicio = new Date(ano, 0, 1);
      fim = new Date();
    }

    const pad = (n) => String(n).padStart(2, "0");
    const toLocalISO = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    return {
      inicio: toLocalISO(inicio),
      fim: toLocalISO(fim)
    };
  };

  const carregarDados = async () => {
    try {
      const { inicio, fim } = getIntervalo();
      const response = await gastosPorIntervalo(inicio, fim);

      if (periodo === "ano") {
        const meses = {};

        response.forEach((g) => {
          const data = new Date(g.data_hora);
          const mes = data.getMonth() + 1;

          const hoje = new Date();
          if (data > hoje) return;

          if (!meses[mes]) {
            meses[mes] = { entrada: 0, saida: 0 };
          }

          if (g.tipo === "entrada") {
            meses[mes].entrada += g.valor;
          } else {
            meses[mes].saida += g.valor;
          }
        });

        const formatado = Object.keys(meses)
          .map((mes) => ({
            mes: String(mes).padStart(2, "0"),
            entrada: meses[mes].entrada,
            saida: meses[mes].saida
          }))
          .sort((a, b) => Number(a.mes) - Number(b.mes));

        setData(formatado);
      } else {
        const agrupado = {};

        response.forEach((g) => {
          if (g.tipo !== "saida") return;

          const dia = g.data_hora?.split("T")[0];

          if (!agrupado[dia]) agrupado[dia] = 0;
          agrupado[dia] += g.valor;
        });

        const formatado = Object.keys(agrupado)
          .map((dia) => ({
            dia,
            total: agrupado[dia]
          }))
          .filter(d => d.total > 0)
          .sort((a, b) => new Date(a.dia) - new Date(b.dia));

        setData(formatado);
      }

    } catch (error) {
      console.error("Erro gráfico:", error);
    }
  };

  return (
    <div style={{
      backgroundColor: "var(--card)",
      padding: "20px",
      borderRadius: "16px",
      height: "359px",
      minHeight: "350px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "var(--shadow-md)"
    }}>
      <h3 style={{ color: "var(--text)", margin: "0 0 12px 0" }}>
        {periodo === "ano" ? "Resumo do Ano" : "Gastos por Dia"}
      </h3>

      {data.length === 0 ? (
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
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            {periodo === "ano" ? (
              <BarChart data={data} barGap={10}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="gradEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="gradSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <XAxis dataKey="mes" stroke="var(--subtext)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--subtext)" tick={{ fontSize: 12 }} width={45} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="entrada" fill="url(#gradEntrada)" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="saida" fill="url(#gradSaida)" radius={[6, 6, 0, 0]} barSize={14} />
              </BarChart>
            ) : (
              <AreaChart data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3bf69f" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3bf69f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <XAxis
                  dataKey="dia"
                  stroke="var(--subtext)"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(val) => {
                    const [, mes, dia] = val.split("-");
                    return `${dia}/${mes}`;
                  }}
                />
                <YAxis stroke="var(--subtext)" tick={{ fontSize: 12 }} width={45} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(59,246,159,0.3)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3bf69f"
                  fill="url(#gradArea)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--card)", stroke: "#3bf69f", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#3bf69f", stroke: "var(--card)", strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ExpensesByDayChart;
