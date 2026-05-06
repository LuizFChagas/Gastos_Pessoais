import { useState } from "react";
import {
  Users, UserPlus, TrendingUp, TrendingDown, Wallet,
  ArrowLeftRight, Check, X, Mail, ShoppingBag, Car, Bell, Home, Coffee
} from "lucide-react";

const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── Dados mock ────────────────────────────────────────────────
const MOCK_EU = {
  nome: "Você",
  iniciais: "EU",
  cor: "#10b981",
  entradas: 7132,
  saidas: 4280,
  categorias: [
    { label: "Alimentação", valor: 980,  cor: "#f97316" },
    { label: "Transporte",  valor: 420,  cor: "#3b82f6" },
    { label: "Lazer",       valor: 650,  cor: "#8b5cf6" },
    { label: "Moradia",     valor: 1800, cor: "#ef4444" },
    { label: "Outros",      valor: 430,  cor: "#64748b" },
  ],
  transacoes: [
    { Icon: Wallet,      desc: "Salário",    tipo: "entrada", valor: 7132  },
    { Icon: Home,        desc: "Aluguel",    tipo: "saida",   valor: 1800  },
    { Icon: ShoppingBag, desc: "Mercado",    tipo: "saida",   valor: 380   },
    { Icon: Car,         desc: "Uber",       tipo: "saida",   valor: 95    },
  ],
};

const MOCK_PARCEIRO = {
  nome: "Parceiro(a)",
  iniciais: "P",
  cor: "#8b5cf6",
  entradas: 5800,
  saidas: 3910,
  categorias: [
    { label: "Alimentação", valor: 740,  cor: "#f97316" },
    { label: "Assinaturas", valor: 290,  cor: "#0ea5e9" },
    { label: "Lazer",       valor: 820,  cor: "#8b5cf6" },
    { label: "Moradia",     valor: 1800, cor: "#ef4444" },
    { label: "Outros",      valor: 260,  cor: "#64748b" },
  ],
  transacoes: [
    { Icon: Wallet,  desc: "Salário",  tipo: "entrada", valor: 5800 },
    { Icon: Home,    desc: "Aluguel",  tipo: "saida",   valor: 1800 },
    { Icon: Bell,    desc: "Netflix",  tipo: "saida",   valor: 39.9 },
    { Icon: Coffee,  desc: "Café",     tipo: "saida",   valor: 87   },
  ],
};

// ── Sub-componentes ───────────────────────────────────────────

function AvatarPill({ pessoa, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${pessoa.cor}cc, ${pessoa.cor})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: "800", color: "white",
    }}>
      {pessoa.iniciais}
    </div>
  );
}

function CardPessoa({ pessoa }) {
  const saldo = pessoa.entradas - pessoa.saidas;
  return (
    <div style={{
      backgroundColor: "var(--card)", borderRadius: "16px",
      border: `1px solid ${pessoa.cor}30`,
      padding: "20px", flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <AvatarPill pessoa={pessoa} size={44} />
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--text)" }}>{pessoa.nome}</div>
          <div style={{ fontSize: "12px", color: "var(--subtext)" }}>Este mês</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "Entradas", valor: pessoa.entradas, cor: "#22c55e" },
          { label: "Saídas",   valor: pessoa.saidas,   cor: "#ef4444" },
          { label: "Saldo",    valor: saldo,            cor: saldo >= 0 ? "#10b981" : "#ef4444" },
        ].map(({ label, valor, cor }) => (
          <div key={label} style={{ textAlign: "center", backgroundColor: "var(--bg)", borderRadius: "10px", padding: "12px 6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "800", color: cor }}>{fmt(valor)}</div>
            <div style={{ fontSize: "10px", color: "var(--subtext)", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {pessoa.categorias.map(({ label, valor, cor }) => {
          const pct = Math.round((valor / pessoa.saidas) * 100);
          return (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ fontSize: "11px", color: "var(--subtext)" }}>{label}</span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text)" }}>{fmt(valor)}</span>
              </div>
              <div style={{ height: "4px", background: "var(--bg)", borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: "2px" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardConjunto() {
  const totalEntradas = MOCK_EU.entradas + MOCK_PARCEIRO.entradas;
  const totalSaidas   = MOCK_EU.saidas   + MOCK_PARCEIRO.saidas;
  const totalSaldo    = totalEntradas - totalSaidas;

  const cats = ["Alimentação", "Transporte", "Lazer", "Moradia", "Assinaturas", "Outros"];
  const conjunta = cats.map((label) => {
    const v1 = MOCK_EU.categorias.find(c => c.label === label)?.valor || 0;
    const v2 = MOCK_PARCEIRO.categorias.find(c => c.label === label)?.valor || 0;
    const total = v1 + v2;
    const cor = MOCK_EU.categorias.find(c => c.label === label)?.cor
             || MOCK_PARCEIRO.categorias.find(c => c.label === label)?.cor
             || "#64748b";
    return { label, total, v1, v2, cor };
  }).filter(c => c.total > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Totais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {[
          { label: "Total entradas", valor: totalEntradas, Icon: TrendingDown, cor: "#22c55e" },
          { label: "Total saídas",   valor: totalSaidas,   Icon: TrendingUp,   cor: "#ef4444" },
          { label: "Saldo conjunto", valor: totalSaldo,    Icon: Wallet,       cor: totalSaldo >= 0 ? "#10b981" : "#ef4444" },
        ].map(({ label, valor, Icon: Ic, cor }) => (
          <div key={label} style={{ backgroundColor: "var(--card)", borderRadius: "14px", padding: "18px", border: "1px solid var(--border)" }}>
            <Ic size={18} color={cor} style={{ marginBottom: "10px" }} />
            <div style={{ fontSize: "20px", fontWeight: "800", color: cor }}>{fmt(valor)}</div>
            <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Categorias conjuntas */}
      <div style={{ backgroundColor: "var(--card)", borderRadius: "16px", border: "1px solid var(--border)", padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Gastos por categoria</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {conjunta.sort((a,b) => b.total - a.total).map(({ label, total, v1, v2, cor }) => {
            const pct = Math.round((total / totalSaidas) * 100);
            return (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: "500" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#10b981" }}>{fmt(v1)}</span>
                    <span style={{ fontSize: "11px", color: "#8b5cf6" }}>{fmt(v2)}</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>{fmt(total)}</span>
                  </div>
                </div>
                {/* barra empilhada */}
                <div style={{ height: "6px", background: "var(--bg)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                  <div style={{ height: "100%", width: `${Math.round((v1/totalSaidas)*100)}%`, background: "#10b981" }} />
                  <div style={{ height: "100%", width: `${Math.round((v2/totalSaidas)*100)}%`, background: "#8b5cf6" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "16px", marginTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: "11px", color: "var(--subtext)" }}>Você</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#8b5cf6" }} />
            <span style={{ fontSize: "11px", color: "var(--subtext)" }}>Parceiro(a)</span>
          </div>
        </div>
      </div>

      {/* Últimas transações conjuntas */}
      <div style={{ backgroundColor: "var(--card)", borderRadius: "16px", border: "1px solid var(--border)", padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Últimas transações</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[...MOCK_EU.transacoes.map(t => ({ ...t, autor: MOCK_EU })),
            ...MOCK_PARCEIRO.transacoes.map(t => ({ ...t, autor: MOCK_PARCEIRO }))]
            .slice(0, 6)
            .map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 34, height: 34, borderRadius: "9px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <t.Icon size={15} color="var(--subtext)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{t.desc}</div>
                  <div style={{ fontSize: "11px", color: t.autor.cor }}>{t.autor.nome}</div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: t.tipo === "entrada" ? "#22c55e" : "#ef4444" }}>
                  {t.tipo === "entrada" ? "+" : "-"}{fmt(t.valor)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function Duo() {
  const [vinculado, setVinculado] = useState(false);
  const [emailConvite, setEmailConvite] = useState("");
  const [enviado, setEnviado]     = useState(false);
  const [visao, setVisao]         = useState("conjunta"); // "conjunta" | "separada"

  const handleConvidar = (e) => {
    e.preventDefault();
    setEnviado(true);
    setTimeout(() => {
      setVinculado(true);
    }, 1500);
  };

  const cardStyle = {
    backgroundColor: "var(--card)", borderRadius: "16px",
    padding: "24px", border: "1px solid var(--border)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, color: "var(--text)" }}>Finly Duo</h1>
            <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>
              BETA
            </span>
          </div>
          <span style={{ color: "var(--subtext)", fontSize: "14px" }}>
            Dashboard financeiro compartilhado
          </span>
        </div>

        {vinculado && (
          <div style={{ display: "flex", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            {["conjunta", "separada"].map((v) => (
              <button key={v} onClick={() => setVisao(v)} style={{
                padding: "8px 18px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                background: visao === v ? "#10b981" : "transparent",
                color: visao === v ? "white" : "var(--subtext)",
                display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s",
              }}>
                {v === "conjunta" ? <><Users size={14} /> Conjunta</> : <><ArrowLeftRight size={14} /> Separada</>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SEM PARCEIRO */}
      {!vinculado && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Hero */}
          <div style={{
            borderRadius: "20px", overflow: "hidden",
            background: "linear-gradient(135deg, #1e1040 0%, #2d1b69 50%, #1a0f3c 100%)",
            border: "1px solid rgba(139,92,246,0.25)",
            padding: "48px 40px",
            display: "flex", alignItems: "center", gap: "48px",
            position: "relative",
          }}>
            {/* glow */}
            <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "260px", height: "260px", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-40px", left: "30%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* avatares sobrepostos */}
            <div style={{ flexShrink: 0, position: "relative", width: "90px", height: "90px" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", color: "white", border: "3px solid #1e1040", zIndex: 2 }}>
                EU
              </div>
              <div style={{ position: "absolute", right: 0, bottom: 0, width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #1e1040", zIndex: 1 }}>
                <UserPlus size={24} color="white" />
              </div>
            </div>

            {/* texto + form */}
            <div style={{ flex: 1, zIndex: 1 }}>
              <h2 style={{ margin: "0 0 8px", color: "white", fontSize: "22px", fontWeight: "800" }}>
                Conecte com seu parceiro(a)
              </h2>
              <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: 1.6, maxWidth: "420px" }}>
                Convide alguém para compartilhar o dashboard financeiro. Vejam tudo juntos ou cada um no seu espaço — com total privacidade.
              </p>

              {!enviado ? (
                <form onSubmit={handleConvidar} style={{ display: "flex", gap: "10px", maxWidth: "420px" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Mail size={15} color="rgba(255,255,255,0.4)" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="email" placeholder="email do parceiro(a)"
                      value={emailConvite} onChange={e => setEmailConvite(e.target.value)}
                      required
                      style={{
                        width: "100%", padding: "11px 14px 11px 38px", borderRadius: "10px",
                        border: "1px solid rgba(139,92,246,0.4)", background: "rgba(255,255,255,0.07)",
                        color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box",
                        fontFamily: "Inter, sans-serif",
                      }}
                      onFocus={e => e.target.style.borderColor = "#8b5cf6"}
                      onBlur={e => e.target.style.borderColor = "rgba(139,92,246,0.4)"}
                    />
                  </div>
                  <button type="submit" style={{
                    padding: "11px 22px", borderRadius: "10px", border: "none", flexShrink: 0,
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    color: "white", fontWeight: "700", fontSize: "14px", cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                  }}>
                    Convidar
                  </button>
                </form>
              ) : (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "10px", padding: "12px 20px", color: "#34d399", fontSize: "14px", fontWeight: "600",
                }}>
                  <Check size={16} /> Convite enviado para <strong>{emailConvite}</strong> — aguardando confirmação
                </div>
              )}
            </div>
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            {[
              {
                Icon: Users,
                titulo: "Visão conjunta",
                desc: "Totais combinados, categorias e transações do casal em um painel unificado",
                cor: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)",
              },
              {
                Icon: ArrowLeftRight,
                titulo: "Visão separada",
                desc: "Dois cards lado a lado para comparar entradas, saídas e categorias individualmente",
                cor: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)",
              },
              {
                Icon: Check,
                titulo: "Privacidade total",
                desc: "Cada pessoa decide o que quer compartilhar — controle granular sobre seus dados",
                cor: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)",
              },
            ].map(({ Icon: Ic, titulo, desc, cor, bg, border }) => (
              <div key={titulo} style={{
                backgroundColor: "var(--card)", borderRadius: "16px",
                border: `1px solid ${border}`, padding: "22px",
              }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: bg, display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "14px",
                }}>
                  <Ic size={20} color={cor} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "6px" }}>{titulo}</div>
                <div style={{ fontSize: "12px", color: "var(--subtext)", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COM PARCEIRO — visão conjunta */}
      {vinculado && visao === "conjunta" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--card)", borderRadius: "14px", padding: "14px 18px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex" }}>
              <AvatarPill pessoa={MOCK_EU}       size={36} />
              <AvatarPill pessoa={MOCK_PARCEIRO} size={36} style={{ marginLeft: "-10px" }} />
            </div>
            <div>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>Você + Parceiro(a)</span>
              <span style={{ fontSize: "12px", color: "var(--subtext)", marginLeft: "8px" }}>• Maio 2026</span>
            </div>
            <button onClick={() => setVinculado(false)} style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
              <X size={13} /> Desconectar
            </button>
          </div>
          <CardConjunto />
        </>
      )}

      {/* COM PARCEIRO — visão separada */}
      {vinculado && visao === "separada" && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <CardPessoa pessoa={MOCK_EU} />
            <CardPessoa pessoa={MOCK_PARCEIRO} />
          </div>
        </>
      )}
    </div>
  );
}
