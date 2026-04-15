import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
  { to: "/app",                icon: "📊", label: "Dashboard"     },
  { to: "/app/transacoes",     icon: "💳", label: "Transações"    },
  { to: "/app/relatorios",     icon: "📈", label: "Relatórios"    },
  { to: "/app/investimentos",  icon: "💹", label: "Investimentos" },
  { to: "/app/importar",       icon: "📁", label: "Importar"      },
];

function Layout({ children, toggleTheme, darkMode }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "20px" }}
          >
            {darkMode ? "🌙" : "☀️"}
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
          {MENU.map(({ to, icon, label }) => (
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
              <span style={{ fontSize: "18px" }}>{icon}</span>
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
            <span style={{ fontSize: "18px" }}>🚪</span>
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
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "18px" }}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </div>

        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {MENU.map(({ to, icon, label }) => (
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
              <span>{icon}</span> {label}
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
          <div style={{ fontSize: "18px", marginBottom: "8px" }}>↗</div>
          <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>Dica do dia</div>
          <div style={{ fontSize: "12px", lineHeight: "1.5", opacity: 0.9 }}>{dica}</div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px",
            borderRadius: "8px", border: "1px solid var(--border)",
            backgroundColor: "transparent", color: "#ef4444",
            cursor: "pointer", fontWeight: "500", fontSize: "14px", textAlign: "left"
          }}
        >
          🚪 Sair
        </button>
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
