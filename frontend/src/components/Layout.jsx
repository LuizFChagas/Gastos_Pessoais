import { Link, useLocation, useNavigate } from "react-router-dom";

function Layout({ children, toggleTheme, darkMode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

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

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ color: "#22c55e", fontWeight: "bold", margin: 0 }}>
            FinanceIA
          </h2>
          <button
            onClick={toggleTheme}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "18px" }}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </div>

        {/* MENU */}
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {[
            { to: "/app", icon: "📊", label: "Dashboard" },
            { to: "/app/transacoes", icon: "💳", label: "Transações" },
            { to: "/app/relatorios", icon: "📈", label: "Relatórios" },
            { to: "/app/importar", icon: "📁", label: "Importar" }
          ].map(({ to, icon, label }) => (
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
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "background 0.15s, color 0.15s"
              }}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>

        {/* BOTÃO SAIR */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "#ef4444",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            textAlign: "left"
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
