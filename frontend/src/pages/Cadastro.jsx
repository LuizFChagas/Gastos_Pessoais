import { useState } from "react";
import { cadastro } from "../api/authApi";
import { Link } from "react-router-dom";

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
import { Wallet, Bot, Zap, TrendingUp, ShoppingBag, Car, Bell, Home, Gamepad2, Target } from "lucide-react";
import { FinlyLogo } from "../components/FinlyLogo";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [cadastrado, setCadastrado] = useState(false);

  const calcularIdade = (dataNasc) => {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("Informe seu nome completo");
      return;
    }

    if (!dataNascimento) {
      setErro("Informe sua data de nascimento");
      return;
    }

    if (calcularIdade(dataNascimento) < 18) {
      setErro("Você precisa ter pelo menos 18 anos para se cadastrar");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    if (forcaSenha(senha) < 4) {
      setErro("A senha deve ter pelo menos 8 caracteres, uma maiúscula, um número e um símbolo");
      return;
    }

    setCarregando(true);

    try {
      await cadastro(email, senha, nome.trim(), dataNascimento);
      setCadastrado(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Erro ao criar conta. Tente novamente.";
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#f0f4ff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "Inter, sans-serif"
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#070b14",
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
      position: "fixed",
      top: 0, left: 0
    }}>

      {/* glow verde top-left */}
      <div style={{
        position: "fixed", top: "-100px", left: "-200px",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%)",
        pointerEvents: "none"
      }} />
      {/* glow azul bottom-right */}
      <div style={{
        position: "fixed", bottom: "-100px", right: "-100px",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)",
        pointerEvents: "none"
      }} />

      {/* ── FLOATING CARDS (só desktop) ── */}

      {/* Card saldo — top left */}
      <div className="login-float-card" style={{
        position: "fixed", top: "12%", left: "6%",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", padding: "16px 20px", width: "200px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat1 5s ease-in-out infinite",
        display: "flex", flexDirection: "column", gap: "10px",
        pointerEvents: "none"
      }}>
        <div style={{ fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>Resumo mensal</div>
        {[
          { label: "Entradas", value: "R$ 7.132", color: "#10b981" },
          { label: "Saídas",   value: "R$ 6.551", color: "#ef4444" },
          { label: "Saldo",    value: "R$ 581",   color: "#3b82f6" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#7d8fa8" }}>{item.label}</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Card transações — bottom left */}
      <div className="login-float-card" style={{
        position: "fixed", bottom: "14%", left: "5%",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", padding: "16px 18px", width: "220px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat2 6s ease-in-out infinite",
        display: "flex", flexDirection: "column", gap: "10px",
        pointerEvents: "none"
      }}>
        <div style={{ fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>Últimas transações</div>
        {[
          { Icon: Wallet,      name: "Salário",   cat: "Entrada",     value: "+R$ 7.132", color: "#10b981" },
          { Icon: ShoppingBag, name: "iFood",     cat: "Alimentação", value: "-R$ 45,90", color: "#ef4444" },
          { Icon: Bell,        name: "Netflix",   cat: "Assinaturas", value: "-R$ 39,90", color: "#ef4444" },
        ].map((item) => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><item.Icon size={14} color="#7d8fa8" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#c8d0de" }}>{item.name}</div>
              <div style={{ fontSize: "10px", color: "#4a5568" }}>{item.cat}</div>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Card categorias — top right */}
      <div className="login-float-card" style={{
        position: "fixed", top: "14%", right: "5%",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", padding: "16px 18px", width: "210px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat3 5.5s ease-in-out infinite",
        display: "flex", flexDirection: "column", gap: "10px",
        pointerEvents: "none"
      }}>
        <div style={{ fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>Por categoria</div>
        {[
          { Icon: ShoppingBag, label: "Alimentação", pct: 32, color: "#f97316" },
          { Icon: Car,         label: "Transporte",  pct: 18, color: "#3b82f6" },
          { Icon: Gamepad2,    label: "Lazer",        pct: 24, color: "#8b5cf6" },
          { Icon: Bell,        label: "Assinaturas",  pct: 14, color: "#0ea5e9" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <item.Icon size={13} color={item.color} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "2px" }} />
            </div>
            <span style={{ fontSize: "10px", color: "#4a5568", minWidth: "26px", textAlign: "right" }}>{item.pct}%</span>
          </div>
        ))}
      </div>

      {/* Card IA — bottom right */}
      <div className="login-float-card" style={{
        position: "fixed", bottom: "16%", right: "6%",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: "16px", padding: "16px 18px", width: "190px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat1 7s ease-in-out 1s infinite",
        display: "flex", flexDirection: "column", gap: "8px",
        pointerEvents: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={14} color="#34d399" /></div>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#34d399" }}>IA Ativa</span>
        </div>
        <div style={{ fontSize: "11px", color: "#4a5568", lineHeight: 1.5 }}>
          3 transações categorizadas automaticamente hoje
        </div>
        <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>98% de precisão ✓</div>
      </div>

      {/* Card meta do mês — center left */}
      <div className="login-float-card" style={{
        position: "fixed", top: "50%", left: "4%", transform: "translateY(-50%)",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", padding: "16px 18px", width: "200px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat3 6.5s ease-in-out 0.5s infinite",
        display: "flex", flexDirection: "column", gap: "10px",
        pointerEvents: "none"
      }}>
        <div style={{ fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>Meta do mês</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#f0f4ff" }}>R$ 3.200</div>
            <div style={{ fontSize: "10px", color: "#4a5568", marginTop: "2px" }}>de R$ 5.000</div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#10b981" }}>64%</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
          <div style={{ width: "64%", height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: "4px" }} />
        </div>
        <div style={{ fontSize: "10px", color: "#4a5568", display: "flex", alignItems: "center", gap: "4px" }}><Target size={10} color="#4a5568" /> Você está no caminho certo</div>
      </div>

      {/* Card notificação — top center */}
      <div className="login-float-card" style={{
        position: "fixed", top: "5%", left: "50%", transform: "translateX(-60%)",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(251,191,36,0.2)",
        borderRadius: "12px", padding: "12px 16px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat2 5s ease-in-out 0.3s infinite",
        display: "flex", alignItems: "center", gap: "10px",
        pointerEvents: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}><Zap size={18} color="#fbbf24" /></div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#fbbf24" }}>Novo extrato importado</div>
          <div style={{ fontSize: "10px", color: "#4a5568" }}>47 transações processadas</div>
        </div>
      </div>

      {/* Card maior gasto — center right */}
      <div className="login-float-card" style={{
        position: "fixed", top: "50%", right: "4%", transform: "translateY(-50%)",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", padding: "16px 18px", width: "195px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat1 6s ease-in-out 1.5s infinite",
        display: "flex", flexDirection: "column", gap: "10px",
        pointerEvents: "none"
      }}>
        <div style={{ fontSize: "10px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>Top gastos</div>
        {[
          { Icon: Home,        name: "Aluguel",     value: "R$ 1.800", w: "72%" },
          { Icon: Car,         name: "Combustível", value: "R$ 420",   w: "35%" },
          { Icon: ShoppingBag, name: "Mercado",     value: "R$ 380",   w: "30%" },
        ].map((item) => (
          <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#7d8fa8", display: "flex", alignItems: "center", gap: "4px" }}><item.Icon size={11} /> {item.name}</span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#f0f4ff" }}>{item.value}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "3px", height: "3px" }}>
              <div style={{ width: item.w, height: "100%", background: "#3b82f6", borderRadius: "3px" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Card economia — bottom center */}
      <div className="login-float-card" style={{
        position: "fixed", bottom: "4%", left: "50%", transform: "translateX(-50%)",
        background: "rgba(15,23,42,0.82)", border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: "12px", padding: "12px 20px",
        backdropFilter: "blur(14px)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        animation: "loginFloat3 7s ease-in-out 2s infinite",
        display: "flex", alignItems: "center", gap: "14px",
        pointerEvents: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}><TrendingUp size={22} color="#60a5fa" /></div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#60a5fa" }}>Economia vs mês anterior</div>
          <div style={{ fontSize: "16px", fontWeight: "800", color: "#10b981" }}>+R$ 430,00 <span style={{ fontSize: "11px", color: "#34d399" }}>↑ 12%</span></div>
        </div>
      </div>

      <style>{`
        @keyframes loginFloat1 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes loginFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(0.3deg); }
        }
        @keyframes loginFloat3 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @media (max-width: 900px) {
          .login-float-card { display: none !important; }
        }
      `}</style>

      {/* LINK VOLTAR */}
      <Link to="/" style={{
        position: "absolute", top: "20px", left: "20px",
        display: "flex", alignItems: "center", gap: "8px",
        color: "#7d8fa8", fontSize: "14px", textDecoration: "none",
        fontWeight: "500", transition: "color 0.2s"
      }}
        onMouseEnter={e => e.currentTarget.style.color = "#10b981"}
        onMouseLeave={e => e.currentTarget.style.color = "#7d8fa8"}
      >
        ← Finly
      </Link>

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 10 }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ marginBottom: "16px", display: "inline-flex" }}>
            <FinlyLogo size={56} />
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#f0f4ff" }}>
            Finly
          </h1>
          <p style={{ margin: "6px 0 0", color: "#7d8fa8", fontSize: "14px" }}>
            Controle seus gastos com inteligência
          </p>
        </div>

        {/* CARD */}
        <div style={{
          backgroundColor: "rgba(15,23,42,0.85)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "32px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)"
        }}>
          <h2 style={{ margin: "0 0 24px", fontSize: "18px", fontWeight: "600", color: "#f0f4ff" }}>
            Criar conta
          </h2>

          {cadastrado ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>📧</div>
              <h3 style={{ margin: "0 0 12px", color: "#f0f4ff", fontSize: "17px" }}>Verifique seu email!</h3>
              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px" }}>
                Enviamos um link de confirmação para <strong style={{ color: "#f0f4ff" }}>{email}</strong>.<br />
                Clique no link para ativar sua conta.
              </p>
              <Link to="/login" style={{ color: "#10b981", fontWeight: "600", fontSize: "14px", textDecoration: "none" }}>
                Ir para o login →
              </Link>
            </div>
          ) : (

          <form onSubmit={handleCadastro} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>
                Nome completo
              </label>
              <input
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>
                Data de nascimento
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
                style={{
                  ...inputStyle,
                  colorScheme: "dark"
                }}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>
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
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>
                Senha
              </label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              {senha && (() => {
                const f = forcaSenha(senha);
                const info = FORCA[f];
                return (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                      <div style={{ width: info.w, height: "100%", background: info.color, borderRadius: "4px", transition: "width 0.3s, background 0.3s" }} />
                    </div>
                    <div style={{ fontSize: "11px", color: info.color, marginTop: "4px" }}>
                      {info.label}{f < 4 ? " — use maiúscula, número e símbolo (ex: Senha@123)" : " ✓"}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>
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
                  borderColor: confirmarSenha && confirmarSenha !== senha ? "#ef4444" : "rgba(255,255,255,0.1)"
                }}
                onFocus={(e) => e.target.style.borderColor = confirmarSenha !== senha ? "#ef4444" : "#10b981"}
                onBlur={(e) => e.target.style.borderColor = confirmarSenha && confirmarSenha !== senha ? "#ef4444" : "rgba(255,255,255,0.1)"}
              />
            </div>

            {erro && (
              <div style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px", padding: "10px 14px",
                fontSize: "13px", color: "#ef4444"
              }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: "100%", padding: "12px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white", fontWeight: "600", fontSize: "15px",
                cursor: carregando ? "not-allowed" : "pointer",
                opacity: carregando ? 0.8 : 1,
                transition: "all 0.2s", marginTop: "4px",
                boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
                fontFamily: "Inter, sans-serif"
              }}
            >
              {carregando ? "Criando conta..." : "Criar conta"}
            </button>

            <p style={{ textAlign: "center", margin: "4px 0 0", fontSize: "14px", color: "#7d8fa8" }}>
              Já tem conta?{" "}
              <Link to="/login" style={{ color: "#10b981", fontWeight: "600", textDecoration: "none" }}>
                Entrar
              </Link>
            </p>

          </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default Cadastro;
