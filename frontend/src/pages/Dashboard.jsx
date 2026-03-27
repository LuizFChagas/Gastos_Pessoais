import { useEffect, useState } from "react";
import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";
import AddTransactionForm from "../components/AddTransactionForm";

import ExpensesByCategoryChart from "../components/charts/ExpensesByCategoryChart";
import ExpensesByDayChart from "../components/charts/ExpensesByDayChart";

import { gastosPorIntervalo } from "../api/gastosApi";

function Dashboard() {
  const [resumo, setResumo] = useState({});
  const [gastos, setGastos] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  // 🔥 (mantido, caso queira usar depois)
  const formatar = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const [periodo, setPeriodo] = useState("mes");

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

      const gastosData = await gastosPorIntervalo(inicio, fim);

      // ✅ CORREÇÃO AQUI (BASEADO EM TIPO)
      const entradas = gastosData
        .filter(g => g.tipo === "entrada")
        .reduce((acc, g) => acc + g.valor, 0);

      const saidas = gastosData
        .filter(g => g.tipo === "saida")
        .reduce((acc, g) => acc + g.valor, 0);

      setResumo({
        entradas,
        saidas,
        saldo: entradas - saidas
      });

      // 🔥 mantém seu padrão
      const formatado = gastosData.map((g) => ({
        ...g,
        data_hora: g.data_hora || g.data,
        banco: g.banco || "Banco"
      }));

      setGastos(formatado);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  return (
    <div>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <span style={{ color: "#6b7280" }}>março de 2026</span>
        </div>

        {/* FILTRO + BOTÃO */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white"
            }}
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Este mês</option>
          </select>

          <button
            onClick={() => setOpenModal(true)}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            + Nova
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <BalanceCard title="Entradas" value={resumo.entradas || 0} color="#22c55e" />
        <BalanceCard title="Saídas" value={resumo.saidas || 0} color="#ef4444" />
        <BalanceCard title="Saldo" value={resumo.saldo || 0} color="#3b82f6" />
      </div>

      {/* GRÁFICOS */}
      <div style={{ display: "flex", gap: "30px", marginTop: "30px" }}>
        <div style={{ flex: 1 }}>
          <ExpensesByCategoryChart data={gastos} />
        </div>

        <div style={{ flex: 1 }}>
          <ExpensesByDayChart data={gastos} />
        </div>
      </div>

      {/* LISTA */}
      <TransactionList transactions={gastos} />

      {/* MODAL */}
      {openModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "16px",
              width: "420px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px"
              }}
            >
              <h3>Nova transação</h3>

              <button
                onClick={() => setOpenModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <AddTransactionForm
              onSuccess={() => {
                setOpenModal(false);
                carregarDados();
              }}
              onCancel={() => setOpenModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;