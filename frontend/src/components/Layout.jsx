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
        width: "240px",
        backgroundColor: "var(--card)",
        borderRight: "1px solid var(--border)",
        padding: "20px",
        display: "flex",
        flexDirection: "column"
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
          <Link
            to="/app"
            style={{
              padding: "10px", borderRadius: "8px",
              backgroundColor: isActive("/app") ? "#dcfce7" : "transparent",
              color: isActive("/app") ? "#16a34a" : "var(--text)",
              textDecoration: "none",
              fontWeight: isActive("/app") ? "bold" : "normal"
            }}
          >
            📊 Dashboard
          </Link>

          <Link
            to="/app/transacoes"
            style={{
              padding: "10px", borderRadius: "8px",
              backgroundColor: isActive("/app/transacoes") ? "#dcfce7" : "transparent",
              color: isActive("/app/transacoes") ? "#16a34a" : "var(--text)",
              textDecoration: "none"
            }}
          >
            💳 Transações
          </Link>

          <Link
            to="/app/importar"
            style={{
              padding: "10px", borderRadius: "8px",
              backgroundColor: isActive("/app/importar") ? "#dcfce7" : "transparent",
              color: isActive("/app/importar") ? "#16a34a" : "var(--text)",
              textDecoration: "none"
            }}
          >
            📁 Importar
          </Link>
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
