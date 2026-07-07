import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CreditCard, BarChart2, TrendingUp, FolderOpen,
  LogOut, Moon, Sun, Lightbulb, User, ChevronUp, Lock, Crown, Check, X, Users, MessageSquare,
} from "lucide-react";
import { getPerfil } from "../api/perfilApi";
import { FinlyLogo } from "./FinlyLogo";
import { enviarSugestao } from "../api/sugestoesApi";

const DICAS = [
  "Acompanhe seus gastos diariamente para manter o controle financeiro.",
  "Reserve pelo menos 10% da sua renda todo mês.",
  "Evite parcelamentos longos — juros corroem seu orçamento.",
  "Revise suas assinaturas mensais e cancele o que não usa.",
  "Tenha uma reserva de emergência de 3 a 6 meses de despesas.",
  "Prefira pagar à vista e negocie desconto.",
  "Invista o dinheiro que sobra antes de gastar o resto.",
  "Pequenos gastos diários somam muito no fim do mês.",
  "Compare preços antes de comprar — todo real conta.",
  "Defina metas financeiras claras para se manter motivada.",
];

const MENU = [
  { to: "/app",               Icon: LayoutDashboard, label: "Dashboard"     },
  { to: "/app/transacoes",    Icon: CreditCard,       label: "Transações"    },
  { to: "/app/relatorios",    Icon: BarChart2,         label: "Relatórios"    },
  { to: "/app/investimentos", Icon: TrendingUp,        label: "Investimentos", premium: true },
  { to: "/app/duo",           Icon: Users,             label: "Duo",           premium: true },
  { to: "/app/importar",      Icon: FolderOpen,        label: "Importar"      },
];

const PREMIUM_FEATURES = [
  "Carteira de investimentos completa",
  "Rentabilidade em tempo real",
  "Cotações ao vivo (ações, cripto, câmbio)",
  "Histórico de aportes por ativo",
  "Finly Duo — dashboard compartilhado",
];

function PremiumModal({ onClose }) {
  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1001,
        width: "100%", maxWidth: "380px",
        backgroundColor: "#0f172a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        padding: "32px 28px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>

        {/* fechar */}
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px",
          background: "transparent", border: "none", cursor: "pointer",
          color: "#4a5568", display: "flex", alignItems: "center",
        }}>
          <X size={18} />
        </button>

        {/* header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px", borderRadius: "16px", marginBottom: "16px",
            background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            boxShadow: "0 8px 24px rgba(251,191,36,0.3)",
          }}>
            <Crown size={26} color="white" />
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", color: "#f0f4ff" }}>
            Finly Premium
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#7d8fa8", lineHeight: 1.5 }}>
            Desbloqueie o controle total<br />das suas finanças
          </p>
        </div>

        {/* features */}
        <div style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          {PREMIUM_FEATURES.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                backgroundColor: "rgba(16,185,129,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={12} color="#10b981" />
              </div>
              <span style={{ fontSize: "13px", color: "#c8d0de" }}>{f}</span>
            </div>
          ))}
        </div>

        {/* botão */}
        <button style={{
          width: "100%", padding: "13px",
          borderRadius: "10px", border: "none",
          background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
          color: "#1a1a1a", fontWeight: "700", fontSize: "15px",
          cursor: "not-allowed", opacity: 0.75,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          <Crown size={16} /> Em breve
        </button>

        <p style={{ textAlign: "center", margin: "12px 0 0", fontSize: "12px", color: "#4a5568" }}>
          Pagamentos serão habilitados em breve
        </p>
      </div>
    </>
  );
}

function PremiumLocked({ onUpgrade }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: "60px 20px", minHeight: "300px",
    }}>
      <div style={{
        width: "64px", height: "64px", borderRadius: "18px", marginBottom: "20px",
        background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 24px rgba(251,191,36,0.3)",
      }}>
        <Lock size={28} color="white" />
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>
        Recurso Premium
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--subtext)", maxWidth: "320px", lineHeight: 1.5 }}>
        Essa página está disponível apenas para assinantes Premium.
      </p>
      <button onClick={onUpgrade} style={{
        padding: "12px 24px", borderRadius: "10px", border: "none",
        background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
        color: "#1a1a1a", fontWeight: "700", fontSize: "14px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <Crown size={16} /> Ver planos Premium
      </button>
    </div>
  );
}

function SugestaoModal({ onClose }) {
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setCarregando(true);
    setErro("");
    try {
      await enviarSugestao(texto.trim());
      setEnviado(true);
    } catch {
      setErro("Erro ao enviar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 1001, width: "100%", maxWidth: "400px",
        backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", padding: "32px 28px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", cursor: "pointer", color: "#4a5568", display: "flex", alignItems: "center" }}>
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <MessageSquare size={20} color="#10b981" />
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#f0f4ff" }}>Enviar sugestão</h2>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5 }}>
          Sua sugestão vai direto para mim. Qualquer ideia, feedback ou melhoria é bem-vinda.
        </p>

        {enviado ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={22} color="#10b981" />
            </div>
            <p style={{ color: "#f0f4ff", fontWeight: "600", margin: "0 0 6px", fontSize: "15px" }}>Sugestão enviada!</p>
            <p style={{ color: "#7d8fa8", fontSize: "13px", margin: "0 0 20px" }}>Obrigado pelo feedback.</p>
            <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "#10b981", color: "white", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <textarea
              placeholder="Escreva sua sugestão..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={5}
              required
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "10px", resize: "vertical",
                border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)",
                color: "#f0f4ff", fontSize: "14px", outline: "none",
                boxSizing: "border-box", fontFamily: "Inter, sans-serif", lineHeight: 1.6,
              }}
              onFocus={(e) => e.target.style.borderColor = "#10b981"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            {erro && (
              <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ef4444" }}>
                {erro}
              </div>
            )}
            <button type="submit" disabled={carregando || !texto.trim()} style={{
              width: "100%", padding: "12px", borderRadius: "10px", border: "none",
              backgroundColor: "#10b981", color: "white", fontWeight: "600", fontSize: "15px",
              cursor: (carregando || !texto.trim()) ? "not-allowed" : "pointer",
              opacity: (carregando || !texto.trim()) ? 0.7 : 1,
            }}>
              {carregando ? "Enviando..." : "Enviar sugestão"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function Layout({ children, toggleTheme, darkMode }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);
  const [menuPerfil, setMenuPerfil]     = useState(false);
  const [showPremium, setShowPremium]   = useState(false);
  const [showSugestao, setShowSugestao] = useState(false);
  const [plano, setPlano]               = useState("free");

  const dica = useMemo(() => DICAS[new Date().getDate() % DICAS.length], []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    getPerfil().then((p) => setPlano(p.plano || "free")).catch(() => {});
  }, []);

  const isActive = (path) => location.pathname === path;
  const isPremiumLocked = (item) => item.premium && plano === "free";

  const currentMenuItem = MENU.find((item) => item.to === location.pathname);
  const contentLocked = isPremiumLocked(currentMenuItem || {});

  const handleMenuClick = (e, item) => {
    if (isPremiumLocked(item)) {
      e.preventDefault();
      setShowPremium(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "100vw", overflowX: "hidden" }}>

        {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
        {showSugestao && <SugestaoModal onClose={() => setShowSugestao(false)} />}

        {/* TOP BAR */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          backgroundColor: "var(--card)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FinlyLogo size={24} />
            <h2 style={{ color: "#22c55e", fontWeight: "700", margin: 0, fontSize: "18px" }}>Finly</h2>
          </div>
          <button
            onClick={toggleTheme}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--subtext)", display: "flex", alignItems: "center" }}
          >
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* CONTEÚDO */}
        <div style={{
          flex: 1, backgroundColor: "var(--bg)", padding: "16px",
          paddingBottom: "80px", overflowY: "auto", overflowX: "hidden",
          width: "100%", boxSizing: "border-box"
        }}>
          {contentLocked ? <PremiumLocked onUpgrade={() => setShowPremium(true)} /> : children}
        </div>

        {/* BOTTOM NAV */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          backgroundColor: "var(--card)", borderTop: "1px solid var(--border)",
          display: "flex"
        }}>
          {MENU.map((item) => {
            const locked = isPremiumLocked(item);
            return (
              <Link
                key={item.to}
                to={locked ? "#" : item.to}
                onClick={(e) => handleMenuClick(e, item)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "8px 2px 10px", textDecoration: "none",
                  color: locked ? "#3a4a5a" : isActive(item.to) ? "#10b981" : "var(--subtext)",
                  fontSize: "10px",
                  fontWeight: isActive(item.to) ? "600" : "400",
                  gap: "3px",
                  borderTop: isActive(item.to) ? "2px solid #10b981" : "2px solid transparent",
                  transition: "all 0.15s", position: "relative"
                }}
              >
                <div style={{ position: "relative" }}>
                  <item.Icon size={20} />
                  {locked && (
                    <Lock size={10} color="#f59e0b" style={{ position: "absolute", top: -4, right: -6 }} />
                  )}
                </div>
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "8px 2px 10px", border: "none", borderTop: "2px solid transparent",
              background: "transparent", color: "#ef4444",
              fontSize: "10px", fontWeight: "400", gap: "3px", cursor: "pointer"
            }}
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </div>
    );
  }

  /* ── DESKTOP ── */
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      {showSugestao && <SugestaoModal onClose={() => setShowSugestao(false)} />}

      {/* SIDEBAR */}
      <div style={{
        width: "220px", backgroundColor: "var(--card)",
        borderRight: "1px solid var(--border)", padding: "20px 16px",
        display: "flex", flexDirection: "column", boxShadow: "var(--shadow)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FinlyLogo size={28} />
          <h2 style={{ color: "#22c55e", fontWeight: "bold", margin: 0 }}>Finly</h2>
        </div>

        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {MENU.map((item) => {
            const locked = isPremiumLocked(item);
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={locked ? "#" : item.to}
                onClick={(e) => handleMenuClick(e, item)}
                style={{
                  padding: "10px 12px", borderRadius: "10px",
                  backgroundColor: active ? "var(--nav-active-bg)" : "transparent",
                  color: locked ? "#3a4a5a" : active ? "var(--nav-active-text)" : "var(--subtext)",
                  textDecoration: "none",
                  fontWeight: active ? "600" : "400",
                  fontSize: "14px",
                  display: "flex", alignItems: "center", gap: "10px",
                  transition: "background 0.15s, color 0.15s",
                  cursor: locked ? "pointer" : "default",
                  filter: locked ? "grayscale(1)" : "none",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!locked && !active) e.currentTarget.style.backgroundColor = "var(--nav-active-bg)"; }}
                onMouseLeave={(e) => { if (!locked && !active) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <item.Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {locked && (
                  <Lock size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* BANNER PREMIUM (só para free) */}
        {plano === "free" && (
          <button
            onClick={() => setShowPremium(true)}
            style={{
              marginTop: "auto", marginBottom: "12px",
              background: "linear-gradient(135deg, #92400e, #b45309, #d97706)",
              borderRadius: "14px", padding: "14px 16px",
              border: "none", cursor: "pointer", textAlign: "left",
              boxShadow: "0 4px 16px rgba(217,119,6,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Crown size={15} color="#fbbf24" />
              <span style={{ fontWeight: "700", fontSize: "13px", color: "#fef3c7" }}>Quer turbinar sua experiência?</span>
            </div>
            <div style={{ fontSize: "11px", color: "#fcd34d", lineHeight: 1.4, opacity: 0.9 }}>
              Desbloqueie investimentos e muito mais
            </div>
          </button>
        )}

        {/* DICA DO DIA (só premium) */}
        {plano === "premium" && (
          <div style={{
            marginTop: "auto",
            background: "linear-gradient(135deg, #059669, #10b981)",
            borderRadius: "14px", padding: "16px", marginBottom: "12px", color: "white",
          }}>
            <div style={{ marginBottom: "8px" }}><Lightbulb size={18} /></div>
            <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>Dica do dia</div>
            <div style={{ fontSize: "12px", lineHeight: "1.5", opacity: 0.9 }}>{dica}</div>
          </div>
        )}

        {/* DICA DO DIA (free também vê) */}
        {plano === "free" && (
          <div style={{
            background: "linear-gradient(135deg, #059669, #10b981)",
            borderRadius: "14px", padding: "16px", marginBottom: "12px", color: "white",
          }}>
            <div style={{ marginBottom: "8px" }}><Lightbulb size={18} /></div>
            <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>Dica do dia</div>
            <div style={{ fontSize: "12px", lineHeight: "1.5", opacity: 0.9 }}>{dica}</div>
          </div>
        )}

        {/* PERFIL */}
        <div style={{ position: "relative" }}>
          {menuPerfil && (
            <>
              <div onClick={() => setMenuPerfil(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
              <div style={{
                position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0,
                backgroundColor: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "12px", overflow: "hidden",
                boxShadow: "0 -8px 24px rgba(0,0,0,0.2)", zIndex: 100
              }}>
                <button onClick={() => { navigate("/app/perfil"); setMenuPerfil(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", border: "none", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: "500", borderBottom: "1px solid var(--border)" }}>
                  <User size={15} /> Perfil
                </button>
                <button onClick={toggleTheme} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", border: "none", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: "500", borderBottom: "1px solid var(--border)" }}>
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                  {darkMode ? "Modo claro" : "Modo escuro"}
                </button>
                <button onClick={() => { setShowSugestao(true); setMenuPerfil(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", border: "none", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: "500", borderBottom: "1px solid var(--border)" }}>
                  <MessageSquare size={15} /> Sugestões
                </button>
                <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setMenuPerfil((v) => !v)}
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "2px solid transparent",
              outline: menuPerfil ? "2px solid #10b981" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "outline 0.15s", flexShrink: 0
            }}
          >
            <User size={18} color="white" />
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, backgroundColor: "var(--bg)", padding: "30px", overflowY: "auto" }}>
        {contentLocked ? <PremiumLocked onUpgrade={() => setShowPremium(true)} /> : children}
      </div>
    </div>
  );
}

export default Layout;
