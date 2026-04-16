import { useEffect, useState } from "react";
import BalanceCard from "../components/BalanceCard";
import TransactionList from "../components/TransactionList";
import AddTransactionForm from "../components/AddTransactionForm";
import ExpensesByCategoryChart from "../components/charts/ExpensesByCategoryChart";
import ExpensesByDayChart from "../components/charts/ExpensesByDayChart";
import { gastosPorIntervalo, listarMesesDisponiveis } from "../api/gastosApi";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const NOMES_MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const NOMES_MESES_MIN = [
  "janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro"
];

function Dashboard() {
  const isMobile = useIsMobile();
  const [resumo, setResumo] = useState({});
  const [gastos, setGastos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [mesesComDados, setMesesComDados] = useState([]);

  const [periodo, setPeriodo] = useState(
    () => localStorage.getItem("dashboard_periodo") || "mes_custom"
  );
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const salvo = localStorage.getItem("dashboard_mes");
    return salvo !== null ? Number(salvo) : new Date().getMonth();
  });
  const [anoSelecionado, setAnoSelecionado] = useState(() => {
    const salvo = localStorage.getItem("dashboard_ano");
    return salvo !== null ? Number(salvo) : new Date().getFullYear();
  });

  // Persiste seleções no localStorage
  useEffect(() => { localStorage.setItem("dashboard_periodo", periodo); }, [periodo]);
  useEffect(() => { localStorage.setItem("dashboard_mes", mesSelecionado); }, [mesSelecionado]);
  useEffect(() => { localStorage.setItem("dashboard_ano", anoSelecionado); }, [anoSelecionado]);

  const toLocalISO = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const getIntervalo = (mes = mesSelecionado, ano = anoSelecionado, per = periodo) => {
    let inicio, fim;

    if (per === "semana") {
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 7);
      fim = new Date();
    }

    if (per === "ano") {
      inicio = new Date(ano, 0, 1, 0, 0, 0);
      fim = new Date(ano, 11, 31, 23, 59, 59);
    }

    if (per === "mes_custom") {
      inicio = new Date(ano, mes, 1, 0, 0, 0);
      fim = new Date(ano, mes + 1, 0, 23, 59, 59);
    }

    return { inicio: toLocalISO(inicio), fim: toLocalISO(fim) };
  };

  const carregarDados = async (mes = mesSelecionado, ano = anoSelecionado, per = periodo) => {
    try {
      const { inicio, fim } = getIntervalo(mes, ano, per);
      const gastosData = await gastosPorIntervalo(inicio, fim);

      const entradas = gastosData
        .filter(g => g.tipo === "entrada")
        .reduce((acc, g) => acc + g.valor, 0);

      const saidas = gastosData
        .filter(g => g.tipo === "saida")
        .reduce((acc, g) => acc + g.valor, 0);

      setResumo({ entradas, saidas, saldo: entradas - saidas });
      setGastos(gastosData.map(g => ({
        ...g,
        data_hora: g.data_hora || g.data,
        banco: g.banco || "Banco"
      })));

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  // Inicialização: carrega meses, corrige ano/mês se necessário e busca dados
  useEffect(() => {
    const inicializar = async () => {
      try {
        const meses = await listarMesesDisponiveis();
        setMesesComDados(meses);

        if (meses.length === 0) { await carregarDados(); return; }

        // Verifica se o ano salvo tem dados; se não, usa o ano mais recente disponível
        let anoCorreto = anoSelecionado;
        const anosOk = [...new Set(meses.map(m => m.ano))];
        if (!anosOk.includes(anoCorreto)) {
          anoCorreto = Math.max(...anosOk);
          setAnoSelecionado(anoCorreto);
        }

        // Verifica se o mês salvo está disponível para o ano correto
        const disponiveis = meses.filter(m => m.ano === anoCorreto).map(m => m.mes);
        let mesCorreto = mesSelecionado;
        if (periodo === "mes_custom" && disponiveis.length > 0 && !disponiveis.includes(mesSelecionado)) {
          mesCorreto = disponiveis[disponiveis.length - 1];
          setMesSelecionado(mesCorreto);
        }

        await carregarDados(mesCorreto, anoCorreto, periodo);
      } catch {
        await carregarDados();
      }
    };

    inicializar();
  }, []);

  // Recarrega quando o usuário muda período/mês/ano manualmente
  useEffect(() => {
    carregarDados();
  }, [periodo, mesSelecionado, anoSelecionado]);

  // Meses disponíveis para o ano selecionado
  const mesesDoAno = mesesComDados
    .filter(m => m.ano === anoSelecionado)
    .map(m => m.mes);

  // Anos disponíveis
  const anosDisponiveis = [...new Set(mesesComDados.map(m => m.ano))].sort((a, b) => b - a);

  // Subtítulo dinâmico
  const getSubtitulo = () => {
    if (periodo === "semana") return "Últimos 7 dias";
    if (periodo === "ano") return `Ano ${anoSelecionado}`;
    if (periodo === "mes_custom") return `${NOMES_MESES_MIN[mesSelecionado]} de ${anoSelecionado}`;
    return "";
  };

  return (
    <div>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "12px" : 0
      }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Dashboard</h1>
          <span style={{ color: "var(--subtext)" }}>{getSubtitulo()}</span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>

          <select
            value={periodo}
            onChange={(e) => {
              const novoPeriodo = e.target.value;
              setPeriodo(novoPeriodo);
              if (novoPeriodo === "mes_custom") {
                if (mesesComDados.length > 0) {
                  const ultimo = mesesComDados[mesesComDados.length - 1];
                  setAnoSelecionado(ultimo.ano);
                  setMesSelecionado(ultimo.mes);
                } else {
                  const hoje = new Date();
                  setMesSelecionado(hoje.getMonth());
                  setAnoSelecionado(hoje.getFullYear());
                }
              }
            }}
            style={{
              padding: "8px 12px", borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)", color: "var(--text)",
              flex: isMobile ? "1 1 auto" : "none"
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
                  padding: "8px", borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)", color: "var(--text)",
                  flex: isMobile ? "1 1 auto" : "none"
                }}
              >
                {mesesDoAno.length > 0 ? (
                  mesesDoAno.map((mes) => (
                    <option key={mes} value={mes}>{NOMES_MESES[mes]}</option>
                  ))
                ) : (
                  NOMES_MESES.map((nome, index) => (
                    <option key={index} value={index}>{nome}</option>
                  ))
                )}
              </select>

              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                style={{
                  padding: "8px", borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)", color: "var(--text)",
                  flex: isMobile ? "0 0 auto" : "none"
                }}
              >
                {anosDisponiveis.length > 0 ? (
                  anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))
                ) : (
                  [2024, 2025, 2026].map((ano) => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))
                )}
              </select>
            </>
          )}

          <button
            onClick={() => setOpenModal(true)}
            style={{
              backgroundColor: "#10b981", color: "white", border: "none",
              padding: "10px 20px", borderRadius: "10px",
              fontWeight: "bold", cursor: "pointer",
              flexShrink: 0
            }}
          >
            + Nova
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div style={isMobile ? {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginTop: "20px",
        width: "100%"
      } : {
        display: "flex",
        gap: "20px",
        marginTop: "20px"
      }}>
        <BalanceCard title="Entradas" value={resumo.entradas || 0} color="#22c55e" isMobile={isMobile} />
        <BalanceCard title="Saídas"   value={resumo.saidas   || 0} color="#ef4444" isMobile={isMobile} />
        <BalanceCard
          title="Saldo"
          value={resumo.saldo || 0}
          color="#3b82f6"
          isMobile={isMobile}
          extraStyle={isMobile ? { gridColumn: "1 / -1" } : {}}
        />
      </div>

      {/* GRÁFICOS */}
      <div style={{
        display: "flex",
        gap: "20px",
        marginTop: "24px",
        alignItems: "stretch",
        flexDirection: isMobile ? "column" : "row"
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ExpensesByCategoryChart data={gastos} isMobile={isMobile} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ExpensesByDayChart
            periodo={periodo === "mes_custom" ? "mes" : periodo}
            mesSelecionado={mesSelecionado}
            anoSelecionado={anoSelecionado}
          />
        </div>
      </div>

      {/* LISTA */}
      <TransactionList transactions={gastos} />

      {/* MODAL NOVA TRANSAÇÃO */}
      {openModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpenModal(false); }}
          style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000
          }}
        >
          <div style={{
            backgroundColor: "var(--card)",
            padding: "28px",
            borderRadius: "20px",
            width: "min(440px, calc(100vw - 32px))",
            color: "var(--text)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            border: "1px solid var(--border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Nova transação</h3>
              <button
                onClick={() => setOpenModal(false)}
                style={{
                  border: "none", background: "var(--input)",
                  cursor: "pointer", color: "var(--subtext)",
                  width: "30px", height: "30px", borderRadius: "8px",
                  fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>

            <AddTransactionForm
              onSuccess={() => { setOpenModal(false); carregarDados(); }}
              onCancel={() => setOpenModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
