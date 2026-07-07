import { useEffect, useState } from "react";
import { getPerfil } from "../api/perfilApi";
import { toggle2FA } from "../api/authApi";
import { User, Mail, Calendar, Clock, TrendingDown, TrendingUp, BarChart2, Shield, ShieldCheck } from "lucide-react";

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function parsearData(str) {
  if (!str) return null;
  // DD/MM/YYYY
  const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}`);
  // YYYY-MM-DD ou ISO
  return new Date(str);
}

function calcularIdade(dataNasc) {
  if (!dataNasc) return null;
  const nasc = parsearData(dataNasc);
  if (!nasc || isNaN(nasc)) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function calcularTempoUsuario(criadoEm) {
  if (!criadoEm) return "—";
  const criado = new Date(criadoEm);
  const agora  = new Date();
  const diffMs = agora - criado;
  const dias   = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (dias === 0) return "Hoje";
  if (dias === 1) return "1 dia";
  if (dias < 30)  return `${dias} dias`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? "1 mês" : `${meses} meses`;
  const anos = Math.floor(meses / 12);
  const mesesRest = meses % 12;
  if (mesesRest === 0) return anos === 1 ? "1 ano" : `${anos} anos`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${mesesRest} ${mesesRest === 1 ? "mês" : "meses"}`;
}

function formatarData(str) {
  if (!str) return "—";
  // já está em DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) return str.slice(0, 10);
  // ISO: YYYY-MM-DD
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return str;
}

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [toggleCarregando, setToggleCarregando] = useState(false);
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  useEffect(() => {
    getPerfil()
      .then((data) => { setPerfil(data); setTwoFA(!!data.two_fa_enabled); })
      .catch(() => setErro(true));
  }, []);

  const abrirConfirmacao2FA = () => {
    setSenhaAtual("");
    setErroSenha("");
    setShowSenhaModal(true);
  };

  const confirmarToggle2FA = async (e) => {
    e.preventDefault();
    setToggleCarregando(true);
    setErroSenha("");
    try {
      const res = await toggle2FA(!twoFA, senhaAtual);
      setTwoFA(res.two_fa_enabled);
      setShowSenhaModal(false);
    } catch {
      setErroSenha("Senha incorreta");
    } finally {
      setToggleCarregando(false);
    }
  };

  const cardStyle = {
    backgroundColor: "var(--card)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-md)",
  };

  const infoRow = (Icon, label, value) => (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "10px",
        backgroundColor: "rgba(16,185,129,0.1)", display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <Icon size={16} color="#10b981" />
      </div>
      <div>
        <div style={{ fontSize: "11px", color: "var(--subtext)", marginBottom: "2px" }}>{label}</div>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{value}</div>
      </div>
    </div>
  );

  if (erro) return (
    <div style={{ color: "var(--subtext)", padding: "40px", textAlign: "center" }}>
      Não foi possível carregar o perfil.
    </div>
  );

  if (!perfil) return (
    <div style={{ color: "var(--subtext)", padding: "40px", textAlign: "center" }}>
      Carregando...
    </div>
  );

  const idade      = calcularIdade(perfil.data_nascimento);
  const tempoUso   = calcularTempoUsuario(perfil.criado_em);
  const iniciaisNome = perfil.nome
    ? perfil.nome.split(" ").slice(0, 2).map(p => p[0].toUpperCase()).join("")
    : "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "640px", margin: "0 auto" }}>

      {/* HEADER */}
      <div>
        <h1 style={{ margin: 0, color: "var(--text)" }}>Perfil</h1>
        <span style={{ color: "var(--subtext)", fontSize: "14px" }}>Suas informações pessoais</span>
      </div>

      {/* CARD AVATAR + NOME */}
      <div style={{
        ...cardStyle,
        display: "flex", alignItems: "center", gap: "20px",
        background: "linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)",
        border: "none", color: "white"
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", fontWeight: "700", flexShrink: 0
        }}>
          {iniciaisNome}
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "700" }}>{perfil.nome || "Sem nome"}</div>
          <div style={{ fontSize: "13px", opacity: 0.85, marginTop: "4px" }}>{perfil.email}</div>
          <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={12} /> Usuário há {tempoUso}
          </div>
        </div>
      </div>

      {/* INFORMAÇÕES */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 4px", color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>Informações</h3>
        <div>
          {infoRow(User,     "Nome completo",      perfil.nome || "—")}
          {infoRow(Mail,     "Email",               perfil.email)}
          {infoRow(Calendar, "Data de nascimento",  `${formatarData(perfil.data_nascimento)}${idade !== null ? ` (${idade} anos)` : ""}`)}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              backgroundColor: "rgba(16,185,129,0.1)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Clock size={16} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--subtext)", marginBottom: "2px" }}>Membro desde</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>
                {formatarData(perfil.criado_em)} · há {tempoUso}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ESTATÍSTICAS */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>Estatísticas</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>

          <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: "12px", backgroundColor: "var(--bg)" }}>
            <BarChart2 size={20} color="#10b981" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>{perfil.total_transacoes}</div>
            <div style={{ fontSize: "11px", color: "var(--subtext)", marginTop: "2px" }}>Transações</div>
          </div>

          <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: "12px", backgroundColor: "var(--bg)" }}>
            <TrendingDown size={20} color="#22c55e" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#22c55e" }}>{fmt(perfil.total_entradas)}</div>
            <div style={{ fontSize: "11px", color: "var(--subtext)", marginTop: "2px" }}>Total entradas</div>
          </div>

          <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: "12px", backgroundColor: "var(--bg)" }}>
            <TrendingUp size={20} color="#ef4444" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#ef4444" }}>{fmt(perfil.total_saidas)}</div>
            <div style={{ fontSize: "11px", color: "var(--subtext)", marginTop: "2px" }}>Total saídas</div>
          </div>

        </div>
      </div>

      {/* SEGURANÇA */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>Segurança</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              backgroundColor: twoFA ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              {twoFA ? <ShieldCheck size={16} color="#10b981" /> : <Shield size={16} color="#7d8fa8" />}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Verificação em 2 etapas</div>
              <div style={{ fontSize: "12px", color: twoFA ? "#10b981" : "var(--subtext)", marginTop: "2px" }}>
                {twoFA ? "Ativa — código enviado por email no login" : "Desativada"}
              </div>
            </div>
          </div>
          <button
            onClick={abrirConfirmacao2FA}
            disabled={toggleCarregando}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: twoFA ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)",
              backgroundColor: twoFA ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
              color: twoFA ? "#ef4444" : "#10b981",
              fontSize: "13px",
              fontWeight: "600",
              cursor: toggleCarregando ? "not-allowed" : "pointer",
              opacity: toggleCarregando ? 0.6 : 1,
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {toggleCarregando ? "..." : twoFA ? "Desativar" : "Ativar"}
          </button>
        </div>
      </div>

      {showSenhaModal && (
        <>
          <div
            onClick={() => setShowSenhaModal(false)}
            style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 1001, width: "100%", maxWidth: "360px",
            backgroundColor: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          }}>
            <h3 style={{ margin: "0 0 8px", color: "var(--text)", fontSize: "16px", fontWeight: "700" }}>
              Confirme sua senha
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--subtext)" }}>
              {twoFA ? "Digite sua senha atual para desativar a verificação em 2 etapas." : "Digite sua senha atual para ativar a verificação em 2 etapas."}
            </p>
            <form onSubmit={confirmarToggle2FA}>
              <input
                type="password"
                autoFocus
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Senha atual"
                required
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "8px",
                  border: "1px solid var(--border)", backgroundColor: "var(--input)",
                  color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
                }}
              />
              {erroSenha && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#ef4444" }}>{erroSenha}</div>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setShowSenhaModal(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={toggleCarregando || !senhaAtual}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                    backgroundColor: "#10b981", color: "white", fontSize: "13px", fontWeight: "600",
                    cursor: (toggleCarregando || !senhaAtual) ? "not-allowed" : "pointer",
                    opacity: (toggleCarregando || !senhaAtual) ? 0.6 : 1,
                  }}
                >
                  {toggleCarregando ? "..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
