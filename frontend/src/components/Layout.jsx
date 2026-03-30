import { Link, useLocation } from "react-router-dom";

function Layout({ children, toggleTheme, darkMode }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* SIDEBAR */}
      <div
        style={{
          width: "240px",
          backgroundColor: "var(--card)",
          borderRight: "1px solid var(--border)",
          padding: "20px"
        }}
      >
        
        {/* 🔥 HEADER COM BOTÃO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <h2 style={{ color: "#22c55e", fontWeight: "bold", margin: 0 }}>
            FinanceIA
          </h2>

          <button
            onClick={toggleTheme}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </div>

        {/* MENU */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <Link
            to="/"
            style={{
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: isActive("/") ? "#dcfce7" : "transparent",
              color: isActive("/") ? "#16a34a" : "var(--text)",
              textDecoration: "none",
              fontWeight: isActive("/") ? "bold" : "normal"
            }}
          >
            Dashboard
          </Link>

          <Link
            to="/transacoes"
            style={{
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: isActive("/transacoes") ? "#dcfce7" : "transparent",
              color: isActive("/transacoes") ? "#16a34a" : "var(--text)",
              textDecoration: "none"
            }}
          >
            Transações
          </Link>

          <Link
            to="/importar"
            style={{
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: isActive("/importar") ? "#dcfce7" : "transparent",
              color: isActive("/importar") ? "#16a34a" : "var(--text)",
              textDecoration: "none"
            }}
          >
            Importar
          </Link>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div
        style={{
          flex: 1,
          backgroundColor: "var(--bg)",
          padding: "30px",
          overflowY: "auto"
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Layout;