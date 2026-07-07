import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import BalanceCard from "../components/BalanceCard";
import AddTransactionForm from "../components/AddTransactionForm";
import ExpensesByCategoryChart from "../components/charts/ExpensesByCategoryChart";
import ExpensesByDayChart from "../components/charts/ExpensesByDayChart";
import { gastosPorIntervalo, listarMesesDisponiveis } from "../api/gastosApi";
import { getPerfil } from "../api/perfilApi";
import { getCategoriaStyle, capitalizar } from "../utils/categorias";

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

function CustomSelect({ value, onChange, options, flex }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: flex || "none" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 14px", borderRadius: "10px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)", color: "var(--text)",
          cursor: "pointer", fontSize: "14px", fontWeight: "500",
          width: "100%", justifyContent: "space-between",
          transition: "border-color 0.15s",
          outline: "none",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#10b981"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          minWidth: "100%", zIndex: 100,
          backgroundColor: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "10px", overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: "10px 16px", cursor: "pointer", fontSize: "14px",
                color: opt.value === value ? "#10b981" : "var(--text)",
                fontWeight: opt.value === value ? "600" : "400",
                backgroundColor: opt.value === value ? "rgba(16,185,129,0.08)" : "transparent",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = opt.value === value ? "rgba(16,185,129,0.08)" : "transparent"; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopGastos({ gastos, periodo }) {
  const titulo =
    periodo === "ano" ? "Maiores gastos do ano" :
    periodo === "semana" ? "Maiores gastos da semana" :
    "Maiores gastos do mês";

  const top = gastos
    .filter(g => g.tipo === "saida" && !g.transferencia_interna)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div style={{
      backgroundColor: "var(--card)",
      padding: "20px",
      borderRadius: "16px",
      marginTop: "20px",
      boxShadow: "var(--shadow-md)"
    }}>
      <h3 style={{ color: "var(--text)", margin: "0 0 12px 0" }}>{titulo}</h3>

      {top.length === 0 ? (
        <div style={{ color: "var(--subtext)", textAlign: "center", padding: "20px 0" }}>
          Nenhuma movimentação encontrada
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {top.map((g, i) => {
            const style = getCategoriaStyle(g.categoria);
            return (
              <div key={g.id ?? i} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 4px",
                borderBottom: i < top.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  backgroundColor: style.chartColor, flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: "var(--text)", fontSize: "14px", fontWeight: "500",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {g.descricao}
                  </div>
                  <div style={{ color: "var(--subtext)", fontSize: "12px", marginTop: "2px" }}>
                    {capitalizar(g.categoria)}
                  </div>
                </div>
                <div style={{ color: "#ef4444", fontSize: "14px", fontWeight: "700", flexShrink: 0 }}>
                  {formatCurrency(g.valor)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const isMobile = useIsMobile();
  const [resumo, setResumo] = useState({});
  const [gastos, setGastos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [mesesComDados, setMesesComDados] = useState([]);
  const [primeiroNome, setPrimeiroNome] = useState("");

  useEffect(() => {
    getPerfil()
      .then((p) => setPrimeiroNome((p.nome || "").trim().split(" ")[0]))
      .catch(() => {});
  }, []);

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
          <h1 style={{ margin: 0, color: "var(--text)", fontSize: "26px", fontWeight: "700" }}>{primeiroNome ? `Olá, ${primeiroNome}` : "Olá!"}</h1>
          <span style={{ color: "var(--subtext)", fontSize: "14px" }}>{getSubtitulo()}</span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>

          <CustomSelect
            value={periodo}
            onChange={(novoPeriodo) => {
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
            options={[
              { value: "semana", label: "Últimos 7 dias" },
              { value: "ano",    label: "Este ano" },
              { value: "mes_custom", label: "Selecionar mês" },
            ]}
            flex={isMobile ? "1 1 auto" : "none"}
          />

          {periodo === "mes_custom" && (
            <>
              <CustomSelect
                value={mesSelecionado}
                onChange={(v) => setMesSelecionado(Number(v))}
                options={
                  (mesesDoAno.length > 0 ? mesesDoAno : NOMES_MESES.map((_, i) => i))
                    .map((mes) => ({ value: mes, label: NOMES_MESES[mes] }))
                }
                flex={isMobile ? "1 1 auto" : "none"}
              />

              <CustomSelect
                value={anoSelecionado}
                onChange={(v) => setAnoSelecionado(Number(v))}
                options={
                  (anosDisponiveis.length > 0 ? anosDisponiveis : [2024, 2025, 2026])
                    .map((ano) => ({ value: ano, label: String(ano) }))
                }
                flex={isMobile ? "0 0 auto" : "none"}
              />
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

      {/* MAIORES GASTOS */}
      <TopGastos gastos={gastos} periodo={periodo === "mes_custom" ? "mes" : periodo} />

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
