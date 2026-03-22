import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";
import AddTransactionForm from "../components/AddTransactionForm";

import ExpensesByCategoryChart from "../components/charts/ExpensesByCategoryChart";
import ExpensesByDayChart from "../components/charts/ExpensesByDayChart";

import {
  resumoDashboard,
  listarGastos
} from "../api/gastosApi";

function Dashboard() {
  const [resumo, setResumo] = useState({});
  const [gastos, setGastos] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
        padding: "30px"
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h1 style={{ fontSize: "28px" }}>Dashboard</h1>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 12px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Sair
        </button>
      </div>

      {/* FORM */}
      <AddTransactionForm onSuccess={carregarDados} />

      {/* CARDS */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        <BalanceCard
          title="Entradas"
          value={resumo.entradas || 0}
          color="#22c55e"
        />

        <BalanceCard
          title="Saídas"
          value={resumo.saidas || 0}
          color="#ef4444"
        />

        <BalanceCard
          title="Saldo"
          value={resumo.saldo || 0}
          color="#3b82f6"
        />
      </div>

      {/* LISTA */}
      <TransactionList transactions={gastos} />

      {/* GRÁFICOS */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          marginTop: "30px"
        }}
      >
        <ExpensesByCategoryChart />
        <ExpensesByDayChart />
      </div>
    </div>
  );
}

export default Dashboard;