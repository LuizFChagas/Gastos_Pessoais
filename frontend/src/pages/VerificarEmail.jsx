import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verificarEmailToken } from "../api/authApi";
import { FinlyLogo } from "../components/FinlyLogo";

export default function VerificarEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState("carregando"); // carregando | sucesso | erro

  useEffect(() => {
    if (!token) { setStatus("erro"); return; }
    verificarEmailToken(token)
      .then(() => setStatus("sucesso"))
      .catch(() => setStatus("erro"));
  }, [token]);

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

        <div style={{ backgroundColor: "rgba(15,23,42,0.85)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "40px 32px", backdropFilter: "blur(16px)", textAlign: "center" }}>
          {status === "carregando" && (
            <>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>⏳</div>
              <p style={{ color: "#94a3b8", fontSize: "15px" }}>Verificando seu email...</p>
            </>
          )}
          {status === "sucesso" && (
            <>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
              <h2 style={{ margin: "0 0 12px", color: "#f0f4ff", fontSize: "18px" }}>Email verificado!</h2>
              <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
                Sua conta está ativa. Agora você pode fazer login.
              </p>
              <Link to="/login" style={{ display: "inline-block", background: "#10b981", color: "white", fontWeight: "700", fontSize: "15px", padding: "12px 28px", borderRadius: "10px", textDecoration: "none" }}>
                Ir para o login
              </Link>
            </>
          )}
          {status === "erro" && (
            <>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>❌</div>
              <h2 style={{ margin: "0 0 12px", color: "#f0f4ff", fontSize: "18px" }}>Link inválido</h2>
              <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
                Este link de verificação é inválido ou já foi utilizado.
              </p>
              <Link to="/cadastro" style={{ color: "#10b981", fontWeight: "600", fontSize: "14px", textDecoration: "none" }}>
                Criar nova conta
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
