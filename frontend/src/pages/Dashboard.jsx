import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <BalanceCard title="Entradas" value="R$ 5000" color="#22c55e" />
        <BalanceCard title="Saídas" value="R$ 2000" color="#ef4444" />
        <BalanceCard title="Saldo" value="R$ 3000" color="#3b82f6" />
      </div>

      <TransactionList />
    </div>
  );
}

export default Dashboard;