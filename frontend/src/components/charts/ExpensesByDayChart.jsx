import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

import { useEffect, useState } from "react";
import { gastosPorIntervalo } from "../../api/gastosApi";

function ExpensesByDayChart({ periodo }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  const getIntervalo = () => {
    const hoje = new Date();
    let inicio, fim;

    if (periodo === "hoje") {
      inicio = new Date(hoje.setHours(0, 0, 0, 0));
      fim = new Date();
    }

    if (periodo === "semana") {
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 7);
      fim = new Date();
    }

    if (periodo === "mes") {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
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

      const agrupado = {};

      response.forEach((g) => {
        const dia = g.data_hora?.split("T")[0];

        if (!agrupado[dia]) agrupado[dia] = 0;

        if (g.tipo === "saida") {
          agrupado[dia] += g.valor;
        }
      });

      const formatado = Object.keys(agrupado)
        .map((dia) => ({
          dia,
          total: agrupado[dia]
        }))
        .sort((a, b) => new Date(a.dia) - new Date(b.dia));

      setData(formatado);

    } catch (error) {
      console.error("Erro ao carregar gráfico:", error);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        padding: "20px",
        borderRadius: "12px"
      }}
    >
      <h3 style={{ color: "var(--text)" }}>Gastos por Dia</h3>

      <LineChart width={500} height={300} data={data}>
        <CartesianGrid stroke="var(--border)" />

        {/* X = DIA/MÊS */}
        <XAxis
          dataKey="dia"
          stroke="var(--text)"
          tickFormatter={(value) => {
            const [ano, mes, dia] = value.split("-");
            return `${dia}/${mes}`;
          }}
        />

        {/* Y = VALOR COM R$ */}
        <YAxis
          stroke="var(--text)"
          tickFormatter={(value) =>
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0
            }).format(value)
          }
        />

        {/* TOOLTIP COMPLETO */}
        <Tooltip
          formatter={(value) => [
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL"
            }).format(value),
            "Valor"
          ]}
          labelFormatter={(label) => {
            const [ano, mes, dia] = label.split("-");
            return `${dia}/${mes}/${ano}`;
          }}
        />

        <Line
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          strokeWidth={3}
        />
      </LineChart>
    </div>
  );
}

export default ExpensesByDayChart;