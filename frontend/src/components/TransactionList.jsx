import { getCategoriaStyle, capitalizar } from "../utils/categorias";

function TransactionList({ transactions }) {

  const formatarData = (data) => {
    if (!data) return "";
    const [ano, mes, dia] = data.split("T")[0].split("-");
    return `${ano}-${mes}-${dia}`;
  };

  return (
    <div style={{
      backgroundColor: "var(--card)",
      padding: "20px",
      borderRadius: "16px",
      marginTop: "20px",
      boxShadow: "var(--shadow-md)"
    }}>
      <h3 style={{ color: "var(--text)" }}>Últimas transações</h3>

      {transactions.length === 0 ? (
        <p style={{ color: "var(--subtext)" }}>Nenhuma transação encontrada.</p>
      ) : (
        transactions.map((t, index) => {
          const descricao = t.descricao || "Sem descrição";
          const data = t.data_hora || "";
          const banco = t.banco || "Banco";
          const isEstorno = t.tipo === "saida" && t.valor < 0;
          const isEntrada = t.tipo === "entrada";
          const isRecorrente = t.categoria?.toLowerCase() === "assinaturas";
          const style = getCategoriaStyle(t.categoria);

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: "1px solid var(--border)"
              }}
            >
              {/* ESQUERDA */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  backgroundColor: isEstorno
                    ? "rgba(148,163,184,0.15)"
                    : isEntrada
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.15)",
                  padding: "10px",
                  borderRadius: "12px",
                  fontSize: "18px"
                }}>
                  {isEstorno ? "↩️" : isEntrada ? "💰" : "💸"}
                </div>

                <div>
                  <div style={{ fontWeight: "600", color: "var(--text)" }}>{descricao}</div>
                  <div style={{ fontSize: "12px", color: "var(--subtext)" }}>
                    {formatarData(data)} · {banco}
                  </div>
                </div>
              </div>

              {/* DIREITA */}
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginBottom: "5px" }}>
                  {isEstorno && (
                    <span style={{
                      fontSize: "10px", fontWeight: "600",
                      padding: "2px 7px", borderRadius: "999px",
                      backgroundColor: "rgba(34,197,94,0.12)",
                      color: "#22c55e",
                      border: "1px solid rgba(34,197,94,0.3)",
                      whiteSpace: "nowrap"
                    }}>
                      ↩ Estorno
                    </span>
                  )}
                  {isRecorrente && (
                    <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(14,165,233,0.12)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)", whiteSpace: "nowrap" }}>
                      🔁 Recorrente
                    </span>
                  )}
                  {t.descricao?.startsWith("Pix") && (
                    <span style={{
                      fontSize: "10px", fontWeight: "600",
                      padding: "2px 7px", borderRadius: "999px",
                      backgroundColor: "rgba(139,92,246,0.12)",
                      color: "#a78bfa",
                      border: "1px solid rgba(139,92,246,0.3)",
                      whiteSpace: "nowrap"
                    }}>
                      ⚡ Pix
                    </span>
                  )}
                  {!t.banco?.toLowerCase().includes("fatura") && !t.descricao?.startsWith("Pix") && (
                    <span style={{
                      fontSize: "10px", fontWeight: "600",
                      padding: "2px 7px", borderRadius: "999px",
                      backgroundColor: "rgba(234,179,8,0.12)",
                      color: "#facc15",
                      border: "1px solid rgba(234,179,8,0.3)",
                      whiteSpace: "nowrap"
                    }}>
                      💳 Débito
                    </span>
                  )}
                  {t.banco?.toLowerCase().includes("fatura") && (
                    <span style={{
                      fontSize: "10px", fontWeight: "600",
                      padding: "2px 7px", borderRadius: "999px",
                      backgroundColor: "rgba(59,130,246,0.12)",
                      color: "#60a5fa",
                      border: "1px solid rgba(59,130,246,0.3)",
                      whiteSpace: "nowrap"
                    }}>
                      💳 Crédito
                    </span>
                  )}
                  {t.data_original && (
                    <span style={{
                      fontSize: "10px", fontWeight: "600",
                      padding: "2px 7px", borderRadius: "999px",
                      backgroundColor: "rgba(251,191,36,0.15)",
                      color: "#f59e0b",
                      border: "1px solid rgba(251,191,36,0.3)",
                      whiteSpace: "nowrap"
                    }}>
                      📅 {new Date(t.data_original).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: style.bg,
                    color: style.color
                  }}>
                    {style.icon} {capitalizar(t.categoria)}
                  </div>
                </div>

                <div style={{
                  color: isEstorno ? "var(--subtext)" : isEntrada ? "#22c55e" : "#ef4444",
                  fontWeight: "bold",
                  textDecoration: isEstorno ? "line-through" : "none"
                }}>
                  R$ {Math.abs(t.valor).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default TransactionList;
