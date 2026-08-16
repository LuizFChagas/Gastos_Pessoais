import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { login, verificarOTP } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";

import { Wallet, Bot, Zap, TrendingUp, ShoppingBag, Car, Bell, Home, Gamepad2, Target, CreditCard, Check } from "lucide-react";
import { FinlyLogo } from "../components/FinlyLogo";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [manterConectado, setManterConectado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.body.classList.contains("dark")
  );
  const [captchaToken, setCaptchaToken] = useState("");
  const [etapa, setEtapa] = useState("login"); // "login" | "otp"
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCodigo, setOtpCodigo] = useState("");
  const recaptchaRef = useRef(null);
  const captchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

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

  /* A sessão de verdade vive num cookie httpOnly (o backend define, o JS
     nem consegue ler). Isso aqui é só uma marcação leve, sem nenhum dado
     sensível, pra decidir instantaneamente se mostra a rota protegida ou
     manda pro /login — a validação real acontece em toda chamada de API. */
  const marcarSessaoAtiva = () => {
    if (manterConectado) {
      localStorage.setItem("finly_auth", "1");
    } else {
      sessionStorage.setItem("finly_auth", "1");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    if (captchaSiteKey && !captchaToken) {
      setErro("Confirme que você não é um robô");
      return;
    }

    setCarregando(true);
    try {
      const data = await login(email, senha, manterConectado, captchaToken);

      if (data.requires_2fa) {
        setOtpEmail(data.email);
        setEtapa("otp");
        return;
      }

      marcarSessaoAtiva();
      navigate("/app");
    } catch (err) {
      const detail = err?.response?.data?.detail || "";
      if (detail.includes("Verifique seu email")) {
        setErro("Confirme seu email antes de entrar. Verifique sua caixa de entrada.");
      } else if (detail.includes("Muitas tentativas")) {
        setErro("Muitas tentativas de login. Aguarde 15 minutos.");
      } else {
        setErro("Email ou senha inválidos");
      }
      recaptchaRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setCarregando(false);
    }
  };

  const handleOTP = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await verificarOTP(otpEmail, otpCodigo, manterConectado);
      marcarSessaoAtiva();
      navigate("/app");
    } catch {
      setErro("Código inválido ou expirado");
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
        ].map((item) => (
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
          { Icon: Wallet,  name: "Salário",   cat: "Entrada",     value: "+R$ 7.132", color: "#10b981" },
          { Icon: ShoppingBag, name: "iFood", cat: "Alimentação", value: "-R$ 45,90", color: "#ef4444" },
          { Icon: Bell,    name: "Netflix",   cat: "Assinaturas", value: "-R$ 39,90", color: "#ef4444" },
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
        <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>98% de precisão <Check size={12} /></div>
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

      {/* Card notificação — top center-left */}
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
          { Icon: Home,        name: "Aluguel",      value: "R$ 1.800", w: "72%" },
          { Icon: Car,         name: "Combustível",  value: "R$ 420",   w: "35%" },
          { Icon: ShoppingBag, name: "Mercado",      value: "R$ 380",   w: "30%" },
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
            {etapa === "otp" ? "Verificação em 2 etapas" : "Entrar na conta"}
          </h2>

          {etapa === "login" ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

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
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>
                  Senha
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: "42px" }}
                    onFocus={(e) => e.target.style.borderColor = "#10b981"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "#7d8fa8", fontSize: "16px", padding: "0", lineHeight: 1,
                      display: "flex", alignItems: "center"
                    }}
                  >
                    {mostrarSenha ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: "right", marginTop: "-8px" }}>
                <Link to="/esqueci-senha" style={{ fontSize: "12px", color: "#7d8fa8", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#10b981"}
                  onMouseLeave={e => e.currentTarget.style.color = "#7d8fa8"}
                >
                  Esqueci minha senha
                </Link>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="manterConectado"
                  checked={manterConectado}
                  onChange={(e) => setManterConectado(e.target.checked)}
                  style={{ accentColor: "#10b981", width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="manterConectado" style={{ fontSize: "13px", color: "#7d8fa8", cursor: "pointer" }}>
                  Manter conectado
                </label>
              </div>

              {captchaSiteKey && (
                <div style={{
                  borderRadius: "12px",
                  border: `1px solid ${captchaToken ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "border-color 0.3s"
                }}>
                  <span style={{ fontSize: "11px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Verificação de segurança
                  </span>
                  <div style={{ display: "flex", justifyContent: "center", transform: "scale(0.95)", transformOrigin: "center" }}>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={captchaSiteKey}
                      onChange={(token) => setCaptchaToken(token || "")}
                      onExpired={() => setCaptchaToken("")}
                      theme="dark"
                    />
                  </div>
                </div>
              )}

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
          ) : (
            <form onSubmit={handleOTP} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              <div style={{
                backgroundColor: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: "#94a3b8",
                lineHeight: 1.5
              }}>
                Enviamos um código de 6 dígitos para <strong style={{ color: "#f0f4ff" }}>{otpEmail}</strong>. Insira-o abaixo para concluir o login.
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#7d8fa8", marginBottom: "6px" }}>
                  Código de verificação
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otpCodigo}
                  onChange={(e) => setOtpCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  autoFocus
                  style={{ ...inputStyle, letterSpacing: "8px", fontSize: "22px", textAlign: "center", fontWeight: "700" }}
                  onFocus={(e) => e.target.style.borderColor = "#10b981"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
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
                disabled={carregando || otpCodigo.length < 6}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#10b981",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "15px",
                  cursor: (carregando || otpCodigo.length < 6) ? "not-allowed" : "pointer",
                  opacity: (carregando || otpCodigo.length < 6) ? 0.6 : 1,
                  transition: "all 0.2s",
                  marginTop: "4px"
                }}
              >
                {carregando ? "Verificando..." : "Verificar código"}
              </button>

              <button
                type="button"
                onClick={() => { setEtapa("login"); setErro(""); setOtpCodigo(""); }}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#7d8fa8", fontSize: "13px", textAlign: "center",
                  padding: "4px"
                }}
              >
                ← Voltar ao login
              </button>

            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#7d8fa8" }}>
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
