import { useEffect, useState } from "react";
import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";
import AddTransactionForm from "../components/AddTransactionForm";

import ExpensesByCategoryChart from "../components/charts/ExpensesByCategoryChart";
import ExpensesByDayChart from "../components/charts/ExpensesByDayChart";

import { gastosPorIntervalo, listarMesesDisponiveis } from "../api/gastosApi";

function Dashboard() {
  const [resumo, setResumo] = useState({});
  const [gastos, setGastos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [periodo, setPeriodo] = useState(
    () => localStorage.getItem("dashboard_periodo") || "mes_custom"
  );
  const [mesSelecionado, setMesSelecionado] = useState(
    () => {
      const salvo = localStorage.getItem("dashboard_mes");
      return salvo !== null ? Number(salvo) : new Date().getMonth();
    }
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    () => {
      const salvo = localStorage.getItem("dashboard_ano");
      return salvo !== null ? Number(salvo) : new Date().getFullYear();
    }
  );
  const [mesesComDados, setMesesComDados] = useState([]);

  const NOMES_MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const NOMES_MESES_MIN = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  useEffect(() => {
    localStorage.setItem("dashboard_periodo", periodo);
    localStorage.setItem("dashboard_mes", mesSelecionado);
    localStorage.setItem("dashboard_ano", anoSelecionado);
  }, [periodo, mesSelecionado, anoSelecionado]);

  useEffect(() => {
    carregarMesesDisponiveis();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [periodo, mesSelecionado, anoSelecionado]);

  const getIntervalo = () => {
    let inicio, fim;

    if (periodo === "semana") {
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 7);
      fim = new Date();
    }

    if (periodo === "ano") {
      inicio = new Date(anoSelecionado, 0, 1);
      fim = new Date(anoSelecionado, 11, 31);
    }

    if (periodo === "mes_custom") {
      inicio = new Date(anoSelecionado, mesSelecionado, 1);
      fim = new Date(anoSelecionado, mesSelecionado + 1, 0);
    }

    return {
      inicio: inicio.toISOString(),
      fim: fim.toISOString()
    };
  };

  const carregarMesesDisponiveis = async () => {
    try {
      const data = await listarMesesDisponiveis();
      setMesesComDados(data);
      if (data.length > 0) {
        const mesesDoAno = data.filter(m => m.ano === anoSelecionado).map(m => m.mes);
        if (mesesDoAno.length > 0 && !mesesDoAno.includes(mesSelecionado)) {
          setMesSelecionado(mesesDoAno[mesesDoAno.length - 1]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar meses disponíveis:", error);
    }
  };

  const carregarDados = async () => {
    try {
      const { inicio, fim } = getIntervalo();

      const gastosData = await gastosPorIntervalo(inicio, fim);

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
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Dashboard</h1>
          <span style={{ color: "var(--subtext)" }}>
            {periodo === "semana" && "Últimos 7 dias"}
            {periodo === "ano" && `Ano de ${anoSelecionado}`}
            {periodo === "mes_custom" && `${NOMES_MESES_MIN[mesSelecionado]} de ${anoSelecionado}`}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          
          <select
            value={periodo}
            onChange={(e) => {
              const novoPeriodo = e.target.value;
              setPeriodo(novoPeriodo);

              if (novoPeriodo === "mes_custom") {
                const hoje = new Date();
                setMesSelecionado(hoje.getMonth());
                setAnoSelecionado(hoje.getFullYear());
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              color: "var(--text)"
            }}
          >
            <option value="semana">Últimos 7 dias</option>
            <option value="ano">Este ano</option>
            <option value="mes_custom">Selecionar mês</option>
          </select>

          {periodo === "mes_custom" && (
            <>
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(Number(e.target.value))}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--text)"
                }}
              >
                {(() => {
                  const mesesDoAno = mesesComDados.filter(m => m.ano === anoSelecionado).map(m => m.mes);
                  if (mesesDoAno.length === 0) {
                    return <option value="" disabled>Nenhum dado disponível</option>;
                  }
                  return mesesDoAno.map((idx) => (
                    <option key={idx} value={idx}>{NOMES_MESES[idx]}</option>
                  ));
                })()}
              </select>

              <select
                value={anoSelecionado}
                onChange={(e) => {
                  const novoAno = Number(e.target.value);
                  setAnoSelecionado(novoAno);
                  const mesesDoNovoAno = mesesComDados.filter(m => m.ano === novoAno).map(m => m.mes);
                  if (mesesDoNovoAno.length > 0 && !mesesDoNovoAno.includes(mesSelecionado)) {
                    setMesSelecionado(mesesDoNovoAno[mesesDoNovoAno.length - 1]);
                  }
                }}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--text)"
                }}
              >
                {[2024, 2025, 2026].map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </>
          )}

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
      <div style={{
        display: "flex",
        gap: "30px",
        marginTop: "30px",
        alignItems: "stretch"
      }}>
        <div style={{ flex: 1, display: "flex" }}>
          <div style={{ width: "100%", height: "100%" }}>
            <ExpensesByCategoryChart data={gastos} />
          </div>
        </div>

        <div style={{ flex: 1, display: "flex" }}>
          <div style={{ width: "100%", height: "100%" }}>
            <ExpensesByDayChart
              periodo={periodo === "mes_custom" ? "mes" : periodo}
              mesSelecionado={mesSelecionado}
              anoSelecionado={anoSelecionado}
            />
          </div>
        </div>
      </div>

      {/* LISTA */}
      <TransactionList transactions={gastos} />

      {/* MODAL */}
      {openModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            backgroundColor: "var(--card)",
            padding: "25px",
            borderRadius: "16px",
            width: "420px",
            color: "var(--text)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px"
            }}>
              <h3>Nova transação</h3>

              <button
                onClick={() => setOpenModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--text)"
                }}
              >
                ✕
              </button>
            </div>

            <AddTransactionForm
              onSuccess={() => {
                setOpenModal(false);
                carregarDados();
                carregarMesesDisponiveis();
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