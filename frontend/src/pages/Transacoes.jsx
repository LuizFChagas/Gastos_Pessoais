import { useEffect, useState, useRef } from "react";
import { listarGastos, deletarGasto, editarGasto, recategorizarLote } from "../api/gastosApi";
import AddTransactionForm from "../components/AddTransactionForm";
import { CATEGORIAS, getCategoriaStyle, capitalizar } from "../utils/categorias";
import {
  AlignJustify, ArrowUp, ArrowDown, Zap, CreditCard, RefreshCw, ArrowLeftRight,
  ArrowDownCircle, ArrowUpCircle, CornerUpLeft, Pencil, Trash2, Landmark, CalendarDays,
  ChevronDown,
} from "lucide-react";

function CustomSelect({ value, onChange, options }) {
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "10px 14px", borderRadius: "10px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--input)", color: "var(--text)",
          cursor: "pointer", fontSize: "14px", fontWeight: "500",
          whiteSpace: "nowrap", outline: "none",
          transition: "border-color 0.15s",
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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const TIPO_FILTROS = [
  { key: "todos",      label: "Todos",      Icon: AlignJustify,  iconColor: null },
  { key: "entradas",   label: "Entradas",   Icon: ArrowDown,     iconColor: "#22c55e" },
  { key: "saidas",     label: "Saídas",     Icon: ArrowUp,       iconColor: "#ef4444" },
  { key: "pix",        label: "Pix",        Icon: Zap,           iconColor: null },
  { key: "debito",     label: "Débito",     Icon: CreditCard,    iconColor: null },
  { key: "credito",    label: "Crédito",    Icon: CreditCard,    iconColor: null },
  { key: "parcelados", label: "Parcelados", Icon: RefreshCw,     iconColor: null },
  { key: "internas",   label: "Internas",   Icon: ArrowLeftRight, iconColor: "#94a3b8" },
];

function Transacoes() {
  const isMobile = useIsMobile();
  const [transacoes, setTransacoes] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [mesFiltro, setMesFiltro] = useState("todos");
  const [anoFiltro, setAnoFiltro] = useState(String(new Date().getFullYear()));
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [gastoSelecionado, setGastoSelecionado] = useState(null);

  // Feature 2 — editar
  const [openEditModal, setOpenEditModal] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [editDescricao, setEditDescricao] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editCategoria, setEditCategoria] = useState("outros");
  const [editTipo, setEditTipo] = useState("saida");
  const [editBanco, setEditBanco] = useState("");
  const [editData, setEditData] = useState("");

  // Feature 9 — seleção em lote
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState(new Set());
  const [openRecatModal, setOpenRecatModal] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("outros");

  const cancelarModoSelecao = () => {
    setModoSelecao(false);
    setSelecionados(new Set());
  };

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      const data = await listarGastos();
      setTransacoes(data);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setGastoSelecionado(id);
    setOpenDeleteModal(true);
  };

  const confirmarDelete = async () => {
    try {
      await deletarGasto(gastoSelecionado);
      setOpenDeleteModal(false);
      carregar();
    } catch {
      alert("Erro ao excluir");
    }
  };

  // Feature 2 — abrir edição
  const handleEditClick = (t) => {
    setGastoEditando(t);
    setEditDescricao(t.descricao || "");
    setEditValor(String(Math.abs(t.valor)));
    setEditCategoria(t.categoria || "outros");
    setEditTipo(t.tipo || "saida");
    setEditBanco(t.banco || "");
    setEditData(t.data_hora ? t.data_hora.split("T")[0] : "");
    setOpenEditModal(true);
  };

  const salvarEdicao = async () => {
    try {
      await editarGasto(gastoEditando.id, {
        descricao: editDescricao,
        valor: parseFloat(editValor),
        categoria: editCategoria,
        tipo: editTipo,
        banco: editBanco,
        data_hora: editData ? editData + "T00:00:00" : undefined,
      });
      setOpenEditModal(false);
      carregar();
    } catch {
      alert("Erro ao editar");
    }
  };

  // Feature 9 — seleção
  const toggleSelecionado = (id) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmarRecategorizar = async () => {
    try {
      await recategorizarLote([...selecionados], novaCategoria);
      cancelarModoSelecao();
      setOpenRecatModal(false);
      carregar();
    } catch {
      alert("Erro ao recategorizar");
    }
  };

  const categorias = ["todos", ...CATEGORIAS];

  // Feature 8 — filtro por tipo
  const matchTipo = (t) => {
    if (tipoFiltro === "entradas") return t.tipo === "entrada";
    if (tipoFiltro === "saidas")   return t.tipo === "saida";
    if (tipoFiltro === "pix")      return t.descricao?.startsWith("Pix");
    if (tipoFiltro === "debito")   return !t.banco?.toLowerCase().includes("fatura") && !t.descricao?.startsWith("Pix");
    if (tipoFiltro === "credito")    return t.banco?.toLowerCase().includes("fatura");
    if (tipoFiltro === "parcelados") return !!t.parcela;
    if (tipoFiltro === "internas")   return !!t.transferencia_interna;
    return true;
  };

  const NOMES_MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const anosDisponiveis = [...new Set(transacoes.map(t => new Date(t.data_hora).getFullYear()))].sort((a, b) => b - a);
  const mesesDisponiveisNoAno = [...new Set(
    transacoes
      .filter(t => anoFiltro === "todos" || String(new Date(t.data_hora).getFullYear()) === anoFiltro)
      .map(t => new Date(t.data_hora).getMonth())
  )].sort((a, b) => b - a);

  const transacoesFiltradas = transacoes.filter((t) => {
    const data = new Date(t.data_hora);
    const matchCategoria = categoriaSelecionada === "todos" ||
      t.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchBusca =
      t.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      t.banco?.toLowerCase().includes(busca.toLowerCase());
    const matchAno = anoFiltro === "todos" || String(data.getFullYear()) === anoFiltro;
    const matchMes = mesFiltro === "todos" || String(data.getMonth()) === mesFiltro;
    return matchCategoria && matchBusca && matchTipo(t) && matchAno && matchMes;
  });

  const formatarDataBonita = (dataStr) => {
    const [ano, mes, dia] = dataStr.split("-");
    const data = new Date(ano, mes - 1, dia);
    const dias = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
    const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
    return `${dias[data.getDay()].toUpperCase()}, ${dia} DE ${meses[data.getMonth()].toUpperCase()}`;
  };

  const agrupadoPorData = transacoesFiltradas.reduce((acc, t) => {
    const data = t.data_hora?.split("T")[0];
    if (!acc[data]) acc[data] = [];
    acc[data].push(t);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(agrupadoPorData).sort((a, b) => new Date(b) - new Date(a));

  const inputStyle = {
    padding: "10px 12px", height: "42px", borderRadius: "10px",
    border: "1px solid var(--border)", backgroundColor: "var(--input)",
    color: "var(--text)", fontSize: "14px", outline: "none",
    boxSizing: "border-box", width: "100%"
  };

  const accentEdit = editTipo === "saida" ? "#ef4444" : "#22c55e";

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
          <h1 style={{ margin: 0, color: "var(--text)" }}>Transações</h1>
          <span style={{ color: "var(--subtext)" }}>
            {transacoes.length} registros encontrados
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
          <button
            onClick={() => modoSelecao ? cancelarModoSelecao() : setModoSelecao(true)}
            style={{
              flex: isMobile ? 1 : "none",
              backgroundColor: modoSelecao ? "rgba(16,185,129,0.12)" : "transparent",
              color: modoSelecao ? "#10b981" : "var(--subtext)",
              border: `1px solid ${modoSelecao ? "#10b981" : "var(--border)"}`,
              padding: "10px 16px", borderRadius: "10px",
              fontWeight: "600", cursor: "pointer", fontSize: "14px"
            }}
          >
            {modoSelecao ? "✕ Cancelar" : "☑ Recategorizar"}
          </button>
          <button
            onClick={() => setOpenModal(true)}
            style={{
              flex: isMobile ? 1 : "none",
              backgroundColor: "#10b981", color: "white", border: "none",
              padding: "10px 16px", borderRadius: "10px",
              fontWeight: "bold", cursor: "pointer"
            }}
          >
            + Nova
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{
        backgroundColor: "var(--card)", padding: "15px",
        borderRadius: "12px", marginTop: "20px"
      }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            placeholder="🔍 Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ flex: 1, minWidth: "160px", padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "var(--input)", color: "var(--text)" }}
          />
          <CustomSelect
            value={anoFiltro}
            onChange={(v) => { setAnoFiltro(v); setMesFiltro("todos"); }}
            options={[
              { value: "todos", label: "Todos os anos" },
              ...anosDisponiveis.map(a => ({ value: String(a), label: String(a) }))
            ]}
          />
          <CustomSelect
            value={mesFiltro}
            onChange={setMesFiltro}
            options={[
              { value: "todos", label: "Todos os meses" },
              ...mesesDisponiveisNoAno.map(m => ({ value: String(m), label: NOMES_MESES[m] }))
            ]}
          />
          <CustomSelect
            value={categoriaSelecionada}
            onChange={(v) => setCategoriaSelecionada(v)}
            options={categorias.map((cat) => ({ value: cat, label: cat === "todos" ? "Todas" : capitalizar(cat) }))}
          />
        </div>

        {/* CHIPS DE TIPO — Feature 8 */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          {TIPO_FILTROS.map(({ key, label, Icon, iconColor }) => {
            const ativo = tipoFiltro === key;
            return (
              <button
                key={key}
                onClick={() => setTipoFiltro(key)}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "5px 14px", borderRadius: "999px", fontSize: "12px",
                  fontWeight: "600", cursor: "pointer", border: "1px solid",
                  borderColor: ativo ? "#10b981" : "var(--border)",
                  backgroundColor: ativo ? "rgba(16,185,129,0.12)" : "transparent",
                  color: ativo ? "#10b981" : "var(--subtext)",
                  transition: "all 0.15s"
                }}
              >
                <Icon size={12} color={iconColor || (ativo ? "#10b981" : "currentColor")} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTA */}
      <div style={{ marginTop: "20px" }}>
        {datasOrdenadas.map((data, index) => (
          <div key={index}>
            <div style={{ margin: "20px 0 10px", fontSize: "13px", fontWeight: "700", color: "var(--subtext)" }}>
              {formatarDataBonita(data)}
            </div>

            {agrupadoPorData[data].map((t, i) => {
              const isEstorno = t.tipo === "saida" && t.valor < 0;
              const isEntrada = t.tipo === "entrada";
              const isRecorrente = t.categoria?.toLowerCase() === "assinaturas";
              const style = getCategoriaStyle(t.categoria);
              const isSelecionado = selecionados.has(t.id);

              const tags = (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                  {t.transferencia_interna && (
                    <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.3)", whiteSpace: "nowrap" }}>↔ Interna</span>
                  )}
                  {isEstorno && (
                    <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", whiteSpace: "nowrap" }}>↩ Estorno</span>
                  )}
                  {isRecorrente && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(14,165,233,0.12)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)", whiteSpace: "nowrap" }}><RefreshCw size={10} /> Recorrente</span>
                  )}
                  {t.descricao?.startsWith("Pix") && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", whiteSpace: "nowrap" }}><Zap size={10} /> Pix</span>
                  )}
                  {!t.banco?.toLowerCase().includes("fatura") && !t.descricao?.startsWith("Pix") && t.tipo !== "entrada" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(234,179,8,0.12)", color: "#facc15", border: "1px solid rgba(234,179,8,0.3)", whiteSpace: "nowrap" }}><CreditCard size={10} /> Débito</span>
                  )}
                  {!t.banco?.toLowerCase().includes("fatura") && !t.descricao?.startsWith("Pix") && t.tipo === "entrada" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", whiteSpace: "nowrap" }}><Landmark size={10} /> Conta</span>
                  )}
                  {t.banco?.toLowerCase().includes("fatura") && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", whiteSpace: "nowrap" }}><CreditCard size={10} /> Crédito</span>
                  )}
                  {t.data_original && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(251,191,36,0.15)", color: "#f59e0b", border: "1px solid rgba(251,191,36,0.3)", whiteSpace: "nowrap" }}>
                      <CalendarDays size={10} /> {new Date(t.data_original).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", backgroundColor: style.bg, color: style.color }}>
                    {style.Icon && <style.Icon size={12} />} {capitalizar(t.categoria)}
                  </div>
                </div>
              );

              if (isMobile) {
                return (
                  <div key={i} style={{
                    backgroundColor: isSelecionado ? "rgba(16,185,129,0.06)" : "var(--card)",
                    padding: "12px", borderRadius: "12px", marginBottom: "10px",
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    border: isSelecionado ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                    transition: "all 0.15s"
                  }}>
                    {modoSelecao && (
                      <input type="checkbox" checked={isSelecionado} onChange={() => toggleSelecionado(t.id)}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#10b981", marginTop: "4px", flexShrink: 0 }} />
                    )}
                    <div style={{
                      backgroundColor: isEstorno ? "rgba(148,163,184,0.15)" : isEntrada ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      padding: "8px", borderRadius: "10px", fontSize: "16px", flexShrink: 0
                    }}>
                      {isEstorno ? <CornerUpLeft size={16} /> : isEntrada ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px", wordBreak: "break-word", flex: 1 }}>
                          {t.descricao || "Sem descrição"}
                          {t.parcela && (
                            <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: "700", color: "#10b981" }}>{t.parcela}</span>
                          )}
                        </div>
                        <div style={{ color: isEstorno ? "var(--subtext)" : isEntrada ? "#22c55e" : "#ef4444", fontWeight: "700", fontSize: "14px", whiteSpace: "nowrap", flexShrink: 0 }}>
                          R$ {Math.abs(t.valor).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--subtext)", margin: "2px 0 6px" }}>{t.banco || "Banco"}</div>
                      {tags}
                      <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                        <button onClick={() => handleEditClick(t)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px", color: "var(--subtext)", display: "flex" }} title="Editar"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteClick(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px", color: "#ef4444", display: "flex" }} title="Excluir"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} style={{
                  backgroundColor: isSelecionado ? "rgba(16,185,129,0.06)" : "var(--card)",
                  padding: "15px", borderRadius: "12px", marginBottom: "10px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: isSelecionado ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                  transition: "all 0.15s"
                }}>
                  {/* ESQUERDA */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {modoSelecao && (
                      <input type="checkbox" checked={isSelecionado} onChange={() => toggleSelecionado(t.id)}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#10b981" }} />
                    )}
                    <div style={{
                      backgroundColor: isEstorno ? "rgba(148,163,184,0.15)" : isEntrada ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      padding: "10px", borderRadius: "10px", fontSize: "18px"
                    }}>
                      {isEstorno ? <CornerUpLeft size={16} /> : isEntrada ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--text)", display: "flex", alignItems: "baseline", gap: "6px" }}>
                        {t.descricao || "Sem descrição"}
                        {t.parcela && (
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", letterSpacing: "0.02em" }}>{t.parcela}</span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--subtext)" }}>{t.banco || "Banco"}</div>
                    </div>
                  </div>
                  {/* DIREITA */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginBottom: "5px", flexWrap: "wrap" }}>
                      {tags}
                    </div>
                    <div style={{ color: isEstorno ? "var(--subtext)" : isEntrada ? "#22c55e" : "#ef4444", fontWeight: "bold", textDecoration: isEstorno ? "line-through" : "none" }}>
                      R$ {Math.abs(t.valor).toFixed(2)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px", marginTop: "5px" }}>
                      <button onClick={() => handleEditClick(t)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }} title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => handleDeleteClick(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* BARRA FLUTUANTE — Feature 9 */}
      {selecionados.size > 0 && (
        <div className="floating-bar" style={{
          position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)",
          backgroundColor: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "14px 24px",
          display: "flex", alignItems: "center", gap: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", zIndex: 100
        }}>
          <span style={{ color: "var(--text)", fontWeight: "600", fontSize: "14px" }}>
            {selecionados.size} selecionado{selecionados.size > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setOpenRecatModal(true)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#10b981", color: "white", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
          >
            Recategorizar
          </button>
          <button
            onClick={cancelarModoSelecao}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--subtext)", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* MODAL DELETE */}
      {openDeleteModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "var(--card)", padding: "25px", borderRadius: "16px", width: "min(350px, calc(100vw - 32px))", textAlign: "center" }}>
            <h3 style={{ color: "var(--text)" }}>Excluir transação</h3>
            <p style={{ color: "var(--subtext)" }}>Tem certeza que deseja excluir essa transação?</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setOpenDeleteModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "var(--border)", color: "var(--text)", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarDelete} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#dc2626", color: "white", fontWeight: "bold", cursor: "pointer" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR — Feature 2 */}
      {openEditModal && gastoEditando && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpenEditModal(false); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
        >
          <div style={{ backgroundColor: "var(--card)", padding: "28px", borderRadius: "20px", width: "min(420px, calc(100vw - 32px))", border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "var(--text)", fontSize: "18px" }}>Editar transação</h3>
              <button onClick={() => setOpenEditModal(false)} style={{ border: "none", background: "var(--input)", cursor: "pointer", color: "var(--subtext)", width: "30px", height: "30px", borderRadius: "8px", fontSize: "14px" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Toggle tipo */}
              <div style={{ position: "relative", display: "flex", backgroundColor: "var(--input)", borderRadius: "12px", padding: "4px" }}>
                <div style={{ position: "absolute", top: "4px", left: editTipo === "saida" ? "4px" : "50%", width: "calc(50% - 4px)", height: "calc(100% - 8px)", backgroundColor: accentEdit, borderRadius: "10px", transition: "all 0.25s ease" }} />
                {["saida", "entrada"].map((t) => (
                  <div key={t} onClick={() => setEditTipo(t)} style={{ flex: 1, textAlign: "center", padding: "10px", cursor: "pointer", zIndex: 1, color: editTipo === t ? "white" : "var(--subtext)", fontWeight: "600", fontSize: "14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>{t === "saida" ? <><ArrowUpCircle size={14} /> Saída</> : <><ArrowDownCircle size={14} /> Entrada</>}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "var(--subtext)" }}>Data</label>
                  <input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} style={{ ...inputStyle, marginTop: "6px" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "var(--subtext)" }}>Valor (R$)</label>
                  <input type="text" value={editValor} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setEditValor(e.target.value); }} style={{ ...inputStyle, marginTop: "6px" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--subtext)" }}>Descrição</label>
                <input value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} style={{ ...inputStyle, marginTop: "6px" }} />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "var(--subtext)" }}>Categoria</label>
                  <div style={{ position: "relative", marginTop: "6px" }}>
                    <select value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} style={{ ...inputStyle, paddingRight: "32px", appearance: "none" }}>
                      {CATEGORIAS.map((cat, i) => (
                        <option key={i} value={cat}>{capitalizar(cat)}</option>
                      ))}
                    </select>
                    <svg style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--subtext)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "var(--subtext)" }}>Banco</label>
                  <input value={editBanco} onChange={(e) => setEditBanco(e.target.value)} style={{ ...inputStyle, marginTop: "6px" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button onClick={() => setOpenEditModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--subtext)", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
                <button onClick={salvarEdicao} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: accentEdit, color: "white", fontWeight: "700", cursor: "pointer" }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECATEGORIZAR — Feature 9 */}
      {openRecatModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpenRecatModal(false); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1001 }}
        >
          <div style={{ backgroundColor: "var(--card)", padding: "28px", borderRadius: "20px", width: "min(360px, calc(100vw - 32px))", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 6px", color: "var(--text)" }}>Recategorizar</h3>
            <p style={{ margin: "0 0 20px", color: "var(--subtext)", fontSize: "14px" }}>
              {selecionados.size} transação{selecionados.size > 1 ? "ões" : ""} selecionada{selecionados.size > 1 ? "s" : ""}
            </p>
            <div style={{ position: "relative" }}>
              <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} style={{ width: "100%", padding: "10px 32px 10px 12px", height: "42px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "var(--input)", color: "var(--text)", fontSize: "14px", appearance: "none" }}>
                {CATEGORIAS.map((cat, i) => (
                  <option key={i} value={cat}>{getCategoriaStyle(cat).icon} {capitalizar(cat)}</option>
                ))}
              </select>
              <svg style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--subtext)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setOpenRecatModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--subtext)", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarRecategorizar} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: "#10b981", color: "white", fontWeight: "700", cursor: "pointer" }}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA TRANSAÇÃO */}
      {openModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpenModal(false); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
        >
          <div style={{ backgroundColor: "var(--card)", padding: "25px", borderRadius: "16px", width: "min(420px, calc(100vw - 32px))" }}>
            <AddTransactionForm
              onSuccess={() => { setOpenModal(false); carregar(); }}
              onCancel={() => setOpenModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Transacoes;
