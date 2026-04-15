import { useEffect, useState } from "react";
import { getCategoriaStyle, capitalizar } from "../utils/categorias";
import { ArrowDownCircle, ArrowUpCircle, CornerUpLeft, Zap, CreditCard, RefreshCw, CalendarDays } from "lucide-react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

function TransactionList({ transactions }) {
  const isMobile = useIsMobile();

  const formatarData = (data) => {
    if (!data) return "";
    const [ano, mes, dia] = data.split("T")[0].split("-");
    return `${ano}-${mes}-${dia}`;
  };

  return (
    <div style={{
      backgroundColor: "var(--card)",
      padding: isMobile ? "16px" : "20px",
      borderRadius: "16px",
      marginTop: "20px",
      boxShadow: "var(--shadow-md)"
    }}>
      <h3 style={{ color: "var(--text)", margin: "0 0 12px 0" }}>Últimas transações</h3>

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

          const tags = (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
              {isEstorno && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", whiteSpace: "nowrap" }}>
                  <CornerUpLeft size={10} /> Estorno
                </span>
              )}
              {isRecorrente && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(14,165,233,0.12)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)", whiteSpace: "nowrap" }}>
                  <RefreshCw size={10} /> Recorrente
                </span>
              )}
              {t.descricao?.startsWith("Pix") && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", whiteSpace: "nowrap" }}>
                  <Zap size={10} /> Pix
                </span>
              )}
              {!t.banco?.toLowerCase().includes("fatura") && !t.descricao?.startsWith("Pix") && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(234,179,8,0.12)", color: "#facc15", border: "1px solid rgba(234,179,8,0.3)", whiteSpace: "nowrap" }}>
                  <CreditCard size={10} /> Débito
                </span>
              )}
              {t.banco?.toLowerCase().includes("fatura") && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", whiteSpace: "nowrap" }}>
                  <CreditCard size={10} /> Crédito
                </span>
              )}
              {t.data_original && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(251,191,36,0.15)", color: "#f59e0b", border: "1px solid rgba(251,191,36,0.3)", whiteSpace: "nowrap" }}>
                  <CalendarDays size={10} /> {new Date(t.data_original).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
              )}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "500", backgroundColor: style.bg, color: style.color }}>
                {style.Icon && <style.Icon size={12} />} {capitalizar(t.categoria)}
              </div>
            </div>
          );

          if (isMobile) {
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)"
                }}
              >
                {/* Ícone */}
                <div style={{
                  backgroundColor: isEstorno ? "rgba(148,163,184,0.15)" : isEntrada ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  padding: "8px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  flexShrink: 0
                }}>
                  {isEstorno ? <CornerUpLeft size={16} /> : isEntrada ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                </div>

                {/* Conteúdo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px", wordBreak: "break-word", flex: 1 }}>
                      {descricao}
                    </div>
                    <div style={{
                      color: isEstorno ? "var(--subtext)" : isEntrada ? "#22c55e" : "#ef4444",
                      fontWeight: "700",
                      fontSize: "14px",
                      textDecoration: isEstorno ? "line-through" : "none",
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}>
                      R$ {Math.abs(t.valor).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", color: "var(--subtext)", margin: "2px 0 6px" }}>
                    {formatarData(data)} · {banco}
                  </div>

                  {tags}
                </div>
              </div>
            );
          }

          /* DESKTOP */
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
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  backgroundColor: isEstorno ? "rgba(148,163,184,0.15)" : isEntrada ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  padding: "10px",
                  borderRadius: "12px",
                  fontSize: "18px"
                }}>
                  {isEstorno ? <CornerUpLeft size={16} /> : isEntrada ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                </div>

                <div>
                  <div style={{ fontWeight: "600", color: "var(--text)" }}>{descricao}</div>
                  <div style={{ fontSize: "12px", color: "var(--subtext)" }}>
                    {formatarData(data)} · {banco}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginBottom: "5px" }}>
                  {tags}
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
