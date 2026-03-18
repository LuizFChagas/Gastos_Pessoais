import { useEffect, useState } from "react";
import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";
import { resumoDashboard, listarGastos } from "../api/gastosApi";

function Dashboard() {

  const [resumo, setResumo] = useState({
    entradas: 0,
    saidas: 0,
    saldo: 0
  });

  const [gastos, setGastos] = useState([]);

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

  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        
        <BalanceCard
          title="Entradas"
          value={`R$ ${resumo.entradas}`}
          color="#22c55e"
        />

        <BalanceCard
          title="Saídas"
          value={`R$ ${resumo.saidas}`}
          color="#ef4444"
        />

        <BalanceCard
          title="Saldo"
          value={`R$ ${resumo.saldo}`}
          color="#3b82f6"
        />

      </div>

      <TransactionList transactions={gastos} />

    </div>
  );
}

export default Dashboard;