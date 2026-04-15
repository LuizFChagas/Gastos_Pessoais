import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  listarInvestimentos,
  criarInvestimento,
  editarInvestimento,
  deletarInvestimento,
} from "../api/investimentosApi";
import { gastosPorIntervalo } from "../api/gastosApi";

/* ── Configuração de tipos ── */
const TIPOS = [
  { value: "renda_fixa", label: "Renda Fixa", color: "#10b981" },
  { value: "acoes",      label: "Ações",      color: "#3b82f6" },
  { value: "fiis",       label: "FIIs",       color: "#f59e0b" },
  { value: "cripto",     label: "Cripto",     color: "#8b5cf6" },
  { value: "outros",     label: "Outros",     color: "#94a3b8" },
];

const getTipo = (value) => TIPOS.find((t) => t.value === value) || TIPOS[4];

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v) => {
  const n = Number(v || 0);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
};

/* ── Modal de adicionar/editar ── */
const FORM_VAZIO = {
  nome: "", ticker: "", tipo: "renda_fixa",
  valor_investido: "", valor_atual: "",
  rentabilidade_mes: "", rentabilidade_ano: "",
};

function Modal({ item, onSave, onClose }) {
  const [form, setForm] = useState(
    item
      ? { ...item, valor_investido: item.valor_investido, valor_atual: item.valor_atual,
          rentabilidade_mes: item.rentabilidade_mes, rentabilidade_ano: item.rentabilidade_ano }
      : FORM_VAZIO
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "10px",
    border: "1px solid var(--border)", backgroundColor: "var(--input)",
    color: "var(--text)", fontSize: "14px", outline: "none",
    boxSizing: "border-box", fontFamily: "Inter, sans-serif",
  };

  const labelStyle = { fontSize: "12px", fontWeight: "500", color: "var(--subtext)", marginBottom: "5px", display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "var(--card)", borderRadius: "16px",
        padding: "28px", width: "100%", maxWidth: "460px",
        boxShadow: "var(--shadow-md)", border: "1px solid var(--border)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "var(--text)", fontSize: "17px" }}>
            {item ? "Editar posição" : "Adicionar posição"}
          </h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--subtext)", fontSize: "18px" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Nome + Ticker */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Nome</label>
              <input placeholder="Ex: CDB Banco Inter" value={form.nome} onChange={(e) => set("nome", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ticker</label>
              <input placeholder="Ex: CDB" value={form.ticker} onChange={(e) => set("ticker", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label style={labelStyle}>Tipo</label>
            <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} style={inputStyle}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Valor investido + Valor atual */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Valor investido (R$)</label>
              <input type="number" placeholder="0,00" value={form.valor_investido} onChange={(e) => set("valor_investido", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Valor atual (R$)</label>
              <input type="number" placeholder="0,00" value={form.valor_atual} onChange={(e) => set("valor_atual", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Rentabilidades */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Rentab. mês (%)</label>
              <input type="number" placeholder="0,00" value={form.rentabilidade_mes} onChange={(e) => set("rentabilidade_mes", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Rentab. ano (%)</label>
              <input type="number" placeholder="0,00" value={form.rentabilidade_ano} onChange={(e) => set("rentabilidade_ano", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "11px", borderRadius: "10px",
              border: "1px solid var(--border)", backgroundColor: "transparent",
              color: "var(--subtext)", fontWeight: "600", cursor: "pointer"
            }}>Cancelar</button>
            <button onClick={() => onSave(form)} style={{
              flex: 2, padding: "11px", borderRadius: "10px",
              border: "none", backgroundColor: "#10b981",
              color: "white", fontWeight: "700", cursor: "pointer"
            }}>{item ? "Salvar" : "Adicionar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function Investimentos() {
  const [posicoes, setPosicoes] = useState([]);
  const [saldoMensal, setSaldoMensal] = useState([]);
  const [modal, setModal] = useState(null); // null | "novo" | {item}
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { carregar(); carregarSaldoMensal(); }, []);

  const carregar = async () => {
    try { setPosicoes(await listarInvestimentos()); } catch { }
  };

  /* Busca os últimos 12 meses de gastos e calcula saldo livre por mês */
  const carregarSaldoMensal = async () => {
    try {
      const fim = new Date();
      const inicio = new Date();
      inicio.setMonth(inicio.getMonth() - 11);
      inicio.setDate(1);

      const gastos = await gastosPorIntervalo(inicio.toISOString(), fim.toISOString());

      const porMes = {};
      gastos.forEach((g) => {
        const d = new Date(g.data_hora);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!porMes[chave]) porMes[chave] = { entradas: 0, saidas: 0 };
        if (g.tipo === "entrada") porMes[chave].entradas += g.valor;
        else if (g.tipo === "saida") porMes[chave].saidas += g.valor;
      });

      const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const dados = Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([chave, v]) => {
          const [, mes] = chave.split("-");
          return {
            mes: MESES[Number(mes) - 1],
            saldo: Math.max(0, v.entradas - v.saidas),
            entradas: v.entradas,
            saidas: v.saidas,
          };
        });

      setSaldoMensal(dados);
    } catch { }
  };

  const handleSave = async (form) => {
    const dados = {
      nome:              form.nome,
      ticker:            form.ticker || null,
      tipo:              form.tipo,
      valor_investido:   Number(form.valor_investido) || 0,
      valor_atual:       Number(form.valor_atual) || 0,
      rentabilidade_mes: Number(form.rentabilidade_mes) || 0,
      rentabilidade_ano: Number(form.rentabilidade_ano) || 0,
    };
    try {
      if (modal?.id) await editarInvestimento(modal.id, dados);
      else await criarInvestimento(dados);
      setModal(null);
      carregar();
    } catch { alert("Erro ao salvar"); }
  };

  const handleDelete = async () => {
    try {
      await deletarInvestimento(confirmDelete);
      setConfirmDelete(null);
      carregar();
    } catch { alert("Erro ao excluir"); }
  };

  /* ── Cálculos ── */
  const patrimonioTotal  = posicoes.reduce((a, p) => a + p.valor_atual, 0);
  const totalInvestido   = posicoes.reduce((a, p) => a + p.valor_investido, 0);
  const resultadoTotal   = patrimonioTotal - totalInvestido;
  const rentMediaMes     = posicoes.length
    ? posicoes.reduce((a, p) => a + p.rentabilidade_mes, 0) / posicoes.length : 0;
  const rentMediaAno     = posicoes.length
    ? posicoes.reduce((a, p) => a + p.rentabilidade_ano, 0) / posicoes.length : 0;

  /* Alocação por tipo */
  const alocacao = TIPOS.map((t) => {
    const total = posicoes.filter((p) => p.tipo === t.value).reduce((a, p) => a + p.valor_atual, 0);
    return { ...t, total, pct: patrimonioTotal ? (total / patrimonioTotal) * 100 : 0 };
  }).filter((t) => t.total > 0);

  const cardStyle = {
    backgroundColor: "var(--card)", borderRadius: "14px",
    padding: "20px 24px", boxShadow: "var(--shadow-md)",
    border: "1px solid var(--border)"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Investimentos</h1>
          <span style={{ color: "var(--subtext)", fontSize: "14px" }}>
            {posicoes.length} {posicoes.length === 1 ? "posição" : "posições"}
          </span>
        </div>
        <button
          onClick={() => setModal("novo")}
          style={{
            backgroundColor: "#10b981", color: "white", border: "none",
            padding: "10px 20px", borderRadius: "10px",
            fontWeight: "600", cursor: "pointer", fontSize: "14px"
          }}
        >
          + Adicionar posição
        </button>
      </div>

      {/* ── PATRIMÔNIO + ALOCAÇÃO ── */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

        {/* Card patrimônio */}
        <div style={{
          flex: "1 1 280px",
          background: "linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)",
          borderRadius: "16px", padding: "28px 24px",
          color: "white", boxShadow: "0 8px 30px rgba(16,185,129,0.35)"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "500", opacity: 0.85, marginBottom: "8px" }}>
            Patrimônio total
          </div>
          <div style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: "800", letterSpacing: "-1px", marginBottom: "20px" }}>
            {fmt(patrimonioTotal)}
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.75, marginBottom: "4px" }}>Rentab. mês</div>
              <div style={{ fontSize: "16px", fontWeight: "700" }}>{fmtPct(rentMediaMes)}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.75, marginBottom: "4px" }}>Rentab. ano</div>
              <div style={{ fontSize: "16px", fontWeight: "700" }}>{fmtPct(rentMediaAno)}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.75, marginBottom: "4px" }}>Resultado total</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: resultadoTotal >= 0 ? "#d1fae5" : "#fecaca" }}>
                {resultadoTotal >= 0 ? "+" : ""}{fmt(resultadoTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Alocação */}
        <div style={{ ...cardStyle, flex: "1 1 280px" }}>
          <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>Alocação</h3>

          {alocacao.length === 0 ? (
            <p style={{ color: "var(--subtext)", fontSize: "14px" }}>Nenhuma posição cadastrada.</p>
          ) : (
            <>
              {/* Barra de alocação */}
              <div style={{ display: "flex", height: "10px", borderRadius: "99px", overflow: "hidden", marginBottom: "16px" }}>
                {alocacao.map((t) => (
                  <div key={t.value} style={{ width: `${t.pct}%`, backgroundColor: t.color, transition: "width 0.4s" }} />
                ))}
              </div>

              {/* Legenda */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
                {alocacao.map((t) => (
                  <div key={t.value} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: t.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text)", fontWeight: "500" }}>{t.label}</span>
                    <span style={{ color: "var(--subtext)" }}>{t.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>

              {/* Donut */}
              <div style={{ marginTop: "8px" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={alocacao} dataKey="total" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {alocacao.map((t) => <Cell key={t.value} fill={t.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmt(v)}
                      contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SALDO LIVRE POR MÊS ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>
              Saldo disponível para investir
            </h3>
            <span style={{ fontSize: "13px", color: "var(--subtext)" }}>
              Dinheiro livre (entradas − saídas) por mês
            </span>
          </div>
        </div>

        {saldoMensal.length === 0 ? (
          <p style={{ color: "var(--subtext)", fontSize: "14px" }}>Nenhum dado encontrado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={saldoMensal} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "var(--subtext)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--subtext)", fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [fmt(v), "Saldo livre"]}
                contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)" }}
                cursor={{ fill: "rgba(16,185,129,0.06)" }}
              />
              <Bar dataKey="saldo" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── POSIÇÕES ── */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>
          Posições
        </h3>

        {posicoes.length === 0 ? (
          <p style={{ color: "var(--subtext)", fontSize: "14px" }}>
            Nenhuma posição cadastrada. Clique em "+ Adicionar posição" para começar.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {posicoes.map((p, i) => {
              const tipo = getTipo(p.tipo);
              const resultado = p.valor_atual - p.valor_investido;
              const positivo = resultado >= 0;
              return (
                <div key={p.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 4px",
                  borderBottom: i < posicoes.length - 1 ? "1px solid var(--border)" : "none"
                }}>
                  {/* Esquerda — ticker + nome */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      backgroundColor: `${tipo.color}20`,
                      border: `1px solid ${tipo.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: "700", color: tipo.color, flexShrink: 0
                    }}>
                      {p.ticker || p.nome.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px" }}>{p.nome}</div>
                      <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "2px" }}>
                        {fmtPct(p.rentabilidade_ano)} ao ano · {tipo.label}
                      </div>
                    </div>
                  </div>

                  {/* Direita — valor + ações */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "700", color: "var(--text)", fontSize: "15px" }}>
                        {fmt(p.valor_atual)}
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: positivo ? "#10b981" : "#ef4444", marginTop: "2px" }}>
                        {positivo ? "+" : ""}{fmt(resultado)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => setModal(p)}
                        style={{
                          padding: "6px 10px", borderRadius: "8px",
                          border: "1px solid var(--border)", backgroundColor: "transparent",
                          color: "var(--subtext)", cursor: "pointer", fontSize: "13px"
                        }}
                      >✏️</button>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        style={{
                          padding: "6px 10px", borderRadius: "8px",
                          border: "1px solid var(--border)", backgroundColor: "transparent",
                          color: "#ef4444", cursor: "pointer", fontSize: "13px"
                        }}
                      >🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ADICIONAR/EDITAR ── */}
      {modal && (
        <Modal
          item={modal === "novo" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── MODAL CONFIRMAR DELETE ── */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--card)", borderRadius: "16px", padding: "28px",
            width: "320px", textAlign: "center", boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ color: "var(--text)", margin: "0 0 10px" }}>Excluir posição</h3>
            <p style={{ color: "var(--subtext)", margin: "0 0 24px", fontSize: "14px" }}>
              Tem certeza que deseja excluir essa posição?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "1px solid var(--border)", backgroundColor: "transparent",
                  color: "var(--subtext)", fontWeight: "600", cursor: "pointer"
                }}
              >Cancelar</button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "none", backgroundColor: "#dc2626",
                  color: "white", fontWeight: "700", cursor: "pointer"
                }}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
