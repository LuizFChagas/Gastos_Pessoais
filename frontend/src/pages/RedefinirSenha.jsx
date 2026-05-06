import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { redefinirSenha } from "../api/authApi";
import { FinlyLogo } from "../components/FinlyLogo";

function forcaSenha(s) {
  let n = 0;
  if (s.length >= 8) n++;
  if (/[A-Z]/.test(s)) n++;
  if (/[0-9]/.test(s)) n++;
  if (/[^A-Za-z0-9]/.test(s)) n++;
  return n;
}

const FORCA = {
  0: { label: "", color: "transparent", w: "0%" },
  1: { label: "Fraca",    color: "#ef4444", w: "25%" },
  2: { label: "Razoável", color: "#f97316", w: "50%" },
  3: { label: "Boa",      color: "#eab308", w: "75%" },
  4: { label: "Forte",    color: "#10b981", w: "100%" },
};

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const forca = forcaSenha(novaSenha);
  const info = FORCA[forca];

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)",
    color: "#f0f4ff", fontSize: "14px", outline: "none",
    boxSizing: "border-box", fontFamily: "Inter, sans-serif"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem"); return; }
    if (forca < 4) { setErro("A senha deve ter maiúscula, número e símbolo (ex: Senha@123)"); return; }
    setCarregando(true);
    try {
      await redefinirSenha(token, novaSenha);
      setSucesso(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setErro(err?.response?.data?.detail || "Link inválido ou expirado");
    } finally {
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

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ marginBottom: "16px", display: "inline-flex" }}>
            <FinlyLogo size={56} />
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#f0f4ff" }}>Finly</h1>
        </div>

        <div style={{ backgroundColor: "rgba(15,23,42,0.85)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "32px", backdropFilter: "blur(16px)" }}>
          {sucesso ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
              <h2 style={{ margin: "0 0 12px", color: "#f0f4ff", fontSize: "18px" }}>Senha redefinida!</h2>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "600", color: "#f0f4ff" }}>Nova senha</h2>
              <p style={{ margin: "0 0 24px", color: "#7d8fa8", fontSize: "14px" }}>Crie uma senha forte para sua conta.</p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>Nova senha</label>
                  <input type="password" placeholder="Mínimo 8 caracteres" value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  {novaSenha && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                        <div style={{ width: info.w, height: "100%", background: info.color, borderRadius: "4px", transition: "width 0.3s, background 0.3s" }} />
                      </div>
                      <div style={{ fontSize: "11px", color: info.color, marginTop: "4px" }}>
                        {info.label} {forca < 4 && "— use maiúscula, número e símbolo"}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>Confirmar senha</label>
                  <input type="password" placeholder="Repita a senha" value={confirmar}
                    onChange={e => setConfirmar(e.target.value)} required
                    style={{ ...inputStyle, borderColor: confirmar && confirmar !== novaSenha ? "#ef4444" : "rgba(255,255,255,0.1)" }}
                    onFocus={e => e.target.style.borderColor = confirmar !== novaSenha ? "#ef4444" : "#10b981"}
                    onBlur={e => e.target.style.borderColor = confirmar && confirmar !== novaSenha ? "#ef4444" : "rgba(255,255,255,0.1)"}
                  />
                </div>

                {erro && (
                  <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ef4444" }}>
                    {erro}
                  </div>
                )}

                <button type="submit" disabled={carregando} style={{
                  width: "100%", padding: "12px", borderRadius: "10px", border: "none",
                  backgroundColor: "#10b981", color: "white", fontWeight: "600", fontSize: "15px",
                  cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.8 : 1
                }}>
                  {carregando ? "Salvando..." : "Redefinir senha"}
                </button>

                <Link to="/login" style={{ textAlign: "center", color: "#7d8fa8", fontSize: "13px", textDecoration: "none" }}>
                  ← Voltar ao login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
