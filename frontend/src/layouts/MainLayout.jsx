import { Outlet, NavLink } from "react-router-dom";

function MainLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "20px"
        }}
      >
        <h2 style={{ color: "#16a34a" }}>FinanceIA</h2>

        <nav style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <NavLink
            to="/"
            style={({ isActive }) => ({
              fontWeight: isActive ? "bold" : "normal",
              color: isActive ? "#16a34a" : "#374151"
            })}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/transacoes"
            style={({ isActive }) => ({
              fontWeight: isActive ? "bold" : "normal",
              color: isActive ? "#16a34a" : "#374151"
            })}
          >
            Transações
          </NavLink>

          <NavLink
            to="/importar"
            style={({ isActive }) => ({
              fontWeight: isActive ? "bold" : "normal",
              color: isActive ? "#16a34a" : "#374151"
            })}
          >
            Importar
          </NavLink>

        </nav>
      </aside>

      {/* Conteúdo */}
      <main
        style={{
          flex: 1,
          padding: "40px",
          backgroundColor: "#f3f4f6"
        }}
      >
        <Outlet />
      </main>

    </div>
  );
}

export default MainLayout;