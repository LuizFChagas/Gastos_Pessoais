import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from "recharts";

import { useEffect, useState } from "react";
import { gastosPorIntervalo } from "../../api/gastosApi";

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

    return {
      inicio: inicio.toISOString(),
      fim: fim.toISOString()
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
      borderRadius: "12px",
      height: "359px",
      minHeight: "350px",
      display: "flex",
      flexDirection: "column"
    }}>
      <h3 style={{ color: "var(--text)" }}>
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
        periodo === "ano" ? (
          <BarChart width={550} height={260} data={data} barGap={10}
            margin={{ top: 10, right: 20, left: 50, bottom: 10 }}>
            <CartesianGrid stroke="var(--border)" />
            <XAxis dataKey="mes" stroke="var(--text)" />
            <YAxis stroke="var(--text)" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
            <Legend />
            <Bar dataKey="entrada" fill="#22c55e" radius={[8, 8, 0, 0]} barSize={14} />
            <Bar dataKey="saida" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={14} />
          </BarChart>
        ) : (
          <AreaChart width={550} height={260} data={data}
            margin={{ top: 10, right: 20, left: 50, bottom: 10 }}>
            <CartesianGrid stroke="var(--border)" />
            <XAxis dataKey="dia" stroke="var(--text)" />
            <YAxis stroke="var(--text)" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3bf69f"
              fill="#3bf69f"
              fillOpacity={0.2}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        )
      )}
    </div>
  );
}

export default ExpensesByDayChart;