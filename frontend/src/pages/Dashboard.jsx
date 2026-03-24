import { useEffect, useState } from "react";
import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";
import AddTransactionForm from "../components/AddTransactionForm";

import ExpensesByCategoryChart from "../components/charts/ExpensesByCategoryChart";
import ExpensesByDayChart from "../components/charts/ExpensesByDayChart";

import { resumoDashboard, listarGastos } from "../api/gastosApi";

function Dashboard() {
  const [resumo, setResumo] = useState({});
  const [gastos, setGastos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    carregarDados();
  }, [reload]);

  const carregarDados = async () => {
    try {
      const resumoData = await resumoDashboard();
      const gastosData = await listarGastos();

      setResumo(resumoData);
      setGastos(gastosData);

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

        <button
          onClick={() => setOpenModal(true)}
          style={{
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.2s"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#059669"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#10b981"}
        >
          + Nova
        </button>
      </div>

      {/* CARDS */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <BalanceCard title="Entradas" value={resumo.entradas || 0} color="#22c55e" />
        <BalanceCard title="Saídas" value={resumo.saidas || 0} color="#ef4444" />
        <BalanceCard title="Saldo" value={resumo.saldo || 0} color="#3b82f6" />
      </div>

      {/* LISTA */}
      <TransactionList transactions={gastos} />

      {/* GRÁFICOS */}
      <div style={{ display: "flex", gap: "30px", marginTop: "30px" }}>
        <div style={{ flex: 1 }}>
          <ExpensesByCategoryChart reload={reload} />
        </div>

        <div style={{ flex: 1 }}>
          <ExpensesByDayChart reload={reload} />
        </div>
      </div>

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
            alignItems: "center",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "16px",
              width: "420px",
              animation: "scaleIn 0.2s ease"
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
                  cursor: "pointer",
                  fontSize: "16px"
                }}
              >
                ✕
              </button>
            </div>

            <AddTransactionForm
              onSuccess={() => {
                setReload(prev => prev + 1); // 🔥 atualiza tudo
                setOpenModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ANIMAÇÕES */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

    </div>
  );
}

export default Dashboard;