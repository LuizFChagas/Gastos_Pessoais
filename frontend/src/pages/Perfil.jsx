import { useEffect, useState } from "react";
import { getPerfil } from "../api/perfilApi";
import { User, Mail, Calendar, Clock, TrendingDown, TrendingUp, BarChart2 } from "lucide-react";

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function calcularIdade(dataNasc) {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
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
  const [ano, mes, dia] = str.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    getPerfil()
      .then(setPerfil)
      .catch(() => setErro(true));
  }, []);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "640px" }}>

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

    </div>
  );
}
