import { useState } from "react";
import { Link } from "react-router-dom";
import { esqueceuSenha } from "../api/authApi";
import { FinlyLogo } from "../components/FinlyLogo";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)",
    color: "#f0f4ff", fontSize: "14px", outline: "none",
    boxSizing: "border-box", fontFamily: "Inter, sans-serif"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    try {
      await esqueceuSenha(email);
    } catch {
      // silently ignore — always show success
    } finally {
      setEnviado(true);
      setCarregando(false);
    }
  };

  return (
    <div style={{
      height: "100vh", width: "100vw", display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: "#070b14",
      backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
      backgroundSize: "60px 60px", position: "fixed", top: 0, left: 0
    }}>
      <div style={{ position: "fixed", top: "-100px", left: "-200px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />

      <Link to="/login" style={{ position: "absolute", top: "20px", left: "20px", color: "#7d8fa8", fontSize: "14px", textDecoration: "none", fontWeight: "500" }}
        onMouseEnter={e => e.currentTarget.style.color = "#10b981"}
        onMouseLeave={e => e.currentTarget.style.color = "#7d8fa8"}
      >← Voltar ao login</Link>

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ marginBottom: "16px", display: "inline-flex" }}>
            <FinlyLogo size={56} />
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#f0f4ff" }}>Finly</h1>
        </div>

        <div style={{ backgroundColor: "rgba(15,23,42,0.85)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "32px", backdropFilter: "blur(16px)" }}>
          {enviado ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>📧</div>
              <h2 style={{ margin: "0 0 12px", color: "#f0f4ff", fontSize: "18px" }}>Verifique seu email</h2>
              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px" }}>
                Se o email <strong style={{ color: "#f0f4ff" }}>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
              </p>
              <Link to="/login" style={{ color: "#10b981", fontWeight: "600", fontSize: "14px", textDecoration: "none" }}>
                ← Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "600", color: "#f0f4ff" }}>Esqueceu a senha?</h2>
              <p style={{ margin: "0 0 24px", color: "#7d8fa8", fontSize: "14px" }}>
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>Email</label>
                  <input
                    type="email" placeholder="seu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                <button type="submit" disabled={carregando} style={{
                  width: "100%", padding: "12px", borderRadius: "10px", border: "none",
                  backgroundColor: "#10b981", color: "white", fontWeight: "600", fontSize: "15px",
                  cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.8 : 1
                }}>
                  {carregando ? "Enviando..." : "Enviar link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
