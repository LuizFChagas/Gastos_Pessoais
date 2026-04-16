import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CreditCard, BarChart2, TrendingUp, FolderOpen,
  LogOut, Moon, Sun, Lightbulb, User, ChevronUp,
} from "lucide-react";

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
  { to: "/app",                Icon: LayoutDashboard, label: "Dashboard"     },
  { to: "/app/transacoes",     Icon: CreditCard,      label: "Transações"    },
  { to: "/app/relatorios",     Icon: BarChart2,        label: "Relatórios"    },
  { to: "/app/investimentos",  Icon: TrendingUp,       label: "Investimentos" },
  { to: "/app/importar",       Icon: FolderOpen,       label: "Importar"      },
];

function Layout({ children, toggleTheme, darkMode }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuPerfil, setMenuPerfil] = useState(false);

  const dica = useMemo(() => DICAS[new Date().getDate() % DICAS.length], []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isActive = (path) => location.pathname === path;

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

        {/* TOP BAR */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          backgroundColor: "var(--card)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <h2 style={{ color: "#22c55e", fontWeight: "700", margin: 0, fontSize: "18px" }}>
            FinanceIA
          </h2>
          <button
            onClick={toggleTheme}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--subtext)", display: "flex", alignItems: "center" }}
          >
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* CONTEÚDO */}
        <div style={{
          flex: 1,
          backgroundColor: "var(--bg)",
          padding: "16px",
          paddingBottom: "80px",
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {children}
        </div>

        {/* BOTTOM NAV */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          backgroundColor: "var(--card)",
          borderTop: "1px solid var(--border)",
          display: "flex"
        }}>
          {MENU.map(({ to, Icon, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "8px 2px 10px",
                textDecoration: "none",
                color: isActive(to) ? "#10b981" : "var(--subtext)",
                fontSize: "10px",
                fontWeight: isActive(to) ? "600" : "400",
                gap: "3px",
                borderTop: isActive(to) ? "2px solid #10b981" : "2px solid transparent",
                transition: "all 0.15s"
              }}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "8px 2px 10px",
              border: "none", borderTop: "2px solid transparent",
              background: "transparent",
              color: "#ef4444",
              fontSize: "10px", fontWeight: "400",
              gap: "3px", cursor: "pointer"
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

      {/* SIDEBAR */}
      <div style={{
        width: "220px",
        backgroundColor: "var(--card)",
        borderRight: "1px solid var(--border)",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ color: "#22c55e", fontWeight: "bold", margin: 0 }}>FinanceIA</h2>
          <button
            onClick={toggleTheme}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--subtext)", display: "flex", alignItems: "center" }}
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {MENU.map(({ to, Icon, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: isActive(to) ? "var(--nav-active-bg)" : "transparent",
                color: isActive(to) ? "var(--nav-active-text)" : "var(--subtext)",
                textDecoration: "none",
                fontWeight: isActive(to) ? "600" : "400",
                fontSize: "14px",
                display: "flex", alignItems: "center", gap: "10px",
                transition: "background 0.15s, color 0.15s"
              }}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </div>

        {/* DICA DO DIA */}
        <div style={{
          marginTop: "auto",
          background: "linear-gradient(135deg, #059669, #10b981)",
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "12px",
          color: "white",
        }}>
          <div style={{ marginBottom: "8px" }}><Lightbulb size={18} /></div>
          <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>Dica do dia</div>
          <div style={{ fontSize: "12px", lineHeight: "1.5", opacity: 0.9 }}>{dica}</div>
        </div>

        {/* PERFIL */}
        <div style={{ position: "relative" }}>
          {/* Dropdown */}
          {menuPerfil && (
            <>
              {/* overlay para fechar */}
              <div
                onClick={() => setMenuPerfil(false)}
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
              />
              <div style={{
                position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0,
                backgroundColor: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "12px", overflow: "hidden",
                boxShadow: "0 -8px 24px rgba(0,0,0,0.2)",
                zIndex: 100
              }}>
                {/* Perfil */}
                <button style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 14px", border: "none", background: "transparent",
                  color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: "500",
                  borderBottom: "1px solid var(--border)"
                }}>
                  <User size={15} /> Perfil
                </button>

                {/* Tema */}
                <button
                  onClick={() => { toggleTheme(); setMenuPerfil(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "12px 14px", border: "none", background: "transparent",
                    color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: "500",
                    borderBottom: "1px solid var(--border)"
                  }}
                >
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                  {darkMode ? "Modo claro" : "Modo escuro"}
                </button>

                {/* Sair */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "12px 14px", border: "none", background: "transparent",
                    color: "#ef4444", cursor: "pointer", fontSize: "13px", fontWeight: "500"
                  }}
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </>
          )}

          {/* Botão principal */}
          <button
            onClick={() => setMenuPerfil((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "10px",
              border: "1px solid var(--border)", backgroundColor: "transparent",
              cursor: "pointer", transition: "background 0.15s"
            }}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              <User size={16} color="white" />
            </div>
            <span style={{ flex: 1, textAlign: "left", fontSize: "13px", fontWeight: "500", color: "var(--text)" }}>
              Minha conta
            </span>
            <ChevronUp
              size={14}
              color="var(--subtext)"
              style={{ transform: menuPerfil ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}
            />
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{
        flex: 1,
        backgroundColor: "var(--bg)",
        padding: "30px",
        overflowY: "auto"
      }}>
        {children}
      </div>
    </div>
  );
}

export default Layout;
