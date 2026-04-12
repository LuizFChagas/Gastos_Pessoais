import { useState } from "react";
import { cadastro } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";

function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
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

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setCarregando(true);

    try {
      await cadastro(email, senha);
      navigate("/login");
    } catch {
      setErro("Erro ao criar conta. Tente novamente.");
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
            Criar conta
          </h2>

          <form onSubmit={handleCadastro} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

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
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "var(--subtext)", marginBottom: "6px" }}>
                Confirmar senha
              </label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                style={{
                  ...inputStyle,
                  borderColor: confirmarSenha && confirmarSenha !== senha ? "#ef4444" : "var(--border)"
                }}
                onFocus={(e) => e.target.style.borderColor = confirmarSenha !== senha ? "#ef4444" : "#10b981"}
                onBlur={(e) => e.target.style.borderColor = confirmarSenha && confirmarSenha !== senha ? "#ef4444" : "var(--border)"}
              />
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
              {carregando ? "Criando conta..." : "Criar conta"}
            </button>

          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--subtext)" }}>
          Já tem conta?{" "}
          <Link to="/login" style={{ color: "#10b981", fontWeight: "600", textDecoration: "none" }}>
            Entrar
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Cadastro;
