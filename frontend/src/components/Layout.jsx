import { Link, useLocation } from "react-router-dom";

function Layout({ children }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* SIDEBAR */}
      <div
        style={{
          width: "240px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "20px"
        }}
      >
        <h2 style={{ color: "#22c55e", fontWeight: "bold" }}>
          FinanceIA
        </h2>

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
              color: isActive("/") ? "#16a34a" : "#374151",
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
              color: isActive("/transacoes") ? "#16a34a" : "#374151",
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
              color: isActive("/importar") ? "#16a34a" : "#374151",
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
          backgroundColor: "#f5f7fa",
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