import { getCategoriaStyle, capitalizar } from "../utils/categorias";

function TransactionList({ transactions }) {

  const formatarData = (data) => {
    if (!data) return "";

    const [ano, mes, dia] = data.split("T")[0].split("-");
    return `${ano}-${mes}-${dia}`;
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        padding: "20px",
        borderRadius: "12px",
        marginTop: "20px"
      }}
    >
      <h3 style={{ color: "var(--text)" }}>Últimas transações</h3>

      {transactions.length === 0 ? (
        <p style={{ color: "var(--subtext)" }}>Nenhuma transação encontrada.</p>
      ) : (
        transactions.map((t, index) => {

          const descricao = t.descricao ? t.descricao : "Sem descrição";
          const data = t.data_hora || "";
          const banco = t.banco || "Itaú";

          const isEntrada = t.tipo === "entrada";

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
                
                <div
                  style={{
                    backgroundColor: isEntrada
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(239,68,68,0.2)",
                    padding: "10px",
                    borderRadius: "12px"
                  }}
                >
                  {isEntrada ? "💰" : "💸"}
                </div>

                <div>
                  <div style={{ fontWeight: "600", color: "var(--text)" }}>
                    {descricao}
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--subtext)" }}>
                    {formatarData(data)} • {banco}
                  </div>
                </div>
              </div>

              {/* DIREITA */}
              <div style={{ textAlign: "right" }}>
                
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginBottom: "5px",
                    backgroundColor: getCategoriaStyle(t.categoria).bg,
                    color: getCategoriaStyle(t.categoria).color
                  }}
                >
                  {getCategoriaStyle(t.categoria).icon} {capitalizar(t.categoria)}
                </div>

                <div
                  style={{
                    color: isEntrada ? "#22c55e" : "#ef4444",
                    fontWeight: "bold"
                  }}
                >
                  {isEntrada ? "+" : "-"}R$ {t.valor}
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