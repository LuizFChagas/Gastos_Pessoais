import { useState } from "react";
import { login } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [manterConectado, setManterConectado] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.body.classList.contains("dark")
  );

  const navigate = useNavigate();

  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const data = await login(email, senha, manterConectado);
      localStorage.setItem("token", data.access_token);
      navigate("/app");
    } catch {
      setErro("Email ou senha inválidos");
    } finally {
      setCarregando(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--card)",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--bg)",
      padding: "20px",
      position: "relative"
    }}>

      {/* TOGGLE TEMA */}
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          cursor: "pointer",
          fontSize: "18px",
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {darkMode ? "🌙" : "☀️"}
      </button>

      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            backgroundColor: "#10b981",
            borderRadius: "16px",
            fontSize: "26px",
            marginBottom: "16px"
          }}>
            💰
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "var(--text)" }}>
            FinanceIA
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--subtext)", fontSize: "14px" }}>
            Controle seus gastos com inteligência
          </p>
        </div>

        {/* CARD */}
        <div style={{
          backgroundColor: "var(--card)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          padding: "32px"
        }}>
          <h2 style={{ margin: "0 0 24px", fontSize: "18px", fontWeight: "600", color: "var(--text)" }}>
            Entrar na conta
          </h2>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "var(--subtext)", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "var(--subtext)", marginBottom: "6px" }}>
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="manterConectado"
                checked={manterConectado}
                onChange={(e) => setManterConectado(e.target.checked)}
                style={{ accentColor: "#10b981", width: "16px", height: "16px", cursor: "pointer" }}
              />
              <label htmlFor="manterConectado" style={{ fontSize: "13px", color: "var(--subtext)", cursor: "pointer" }}>
                Manter conectado
              </label>
            </div>

            {erro && (
              <div style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#ef4444"
              }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#10b981",
                color: "white",
                fontWeight: "600",
                fontSize: "15px",
                cursor: carregando ? "not-allowed" : "pointer",
                opacity: carregando ? 0.8 : 1,
                transition: "all 0.2s",
                marginTop: "4px"
              }}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>

          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--subtext)" }}>
          Não tem conta?{" "}
          <Link to="/cadastro" style={{ color: "#10b981", fontWeight: "600", textDecoration: "none" }}>
            Criar conta
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
