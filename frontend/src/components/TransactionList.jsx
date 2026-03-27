function TransactionList({ transactions }) {

  const formatarData = (data) => {
    if (!data) return "";

    const [ano, mes, dia] = data.split("T")[0].split("-");
    return `${ano}-${mes}-${dia}`;
  };

  // 🔥 ESTILO DAS CATEGORIAS (NOVO)
  const getCategoriaStyle = (categoria) => {
    const map = {
      salario: {
        bg: "#d1fae5",
        color: "#065f46",
        icon: "💰"
      },
      alimentação: {
        bg: "#fef3c7",
        color: "#92400e",
        icon: "🍔"
      },
      transporte: {
        bg: "#dbeafe",
        color: "#1e40af",
        icon: "🚗"
      },
      moradia: {
        bg: "#e0e7ff",
        color: "#3730a3",
        icon: "🏠"
      },
      lazer: {
        bg: "#fce7f3",
        color: "#9d174d",
        icon: "🎮"
      },
      educação: {
        bg: "#ede9fe",
        color: "#5b21b6",
        icon: "📚"
      },
      saúde: {
        bg: "#fee2e2",
        color: "#991b1b",
        icon: "💊"
      },
      outros: {
        bg: "#e5e7eb",
        color: "#374151",
        icon: "🏷️"
      }
    };

    return map[categoria?.toLowerCase()] || map["outros"];
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        marginTop: "20px"
      }}
    >
      <h3 style={{ color: "#111827" }}>Últimas transações</h3>

      {transactions.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Nenhuma transação encontrada.</p>
      ) : (
        transactions.map((t, index) => {

          const descricao = t.descricao ? t.descricao : "Sem descrição";
          const data = t.data_hora || "";
          const banco = t.banco || "Itaú";

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: "1px solid #eee"
              }}
            >

              {/* ESQUERDA */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                
                <div
                  style={{
                    backgroundColor: "#ecfdf5",
                    padding: "10px",
                    borderRadius: "12px"
                  }}
                >
                  💰
                </div>

                <div>
                  <div style={{ fontWeight: "600", color: "#111827" }}>
                    {descricao}
                  </div>

                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {formatarData(data)} • {banco}
                  </div>
                </div>
              </div>

              {/* DIREITA */}
              <div style={{ textAlign: "right" }}>
                
                {/* 🔥 CATEGORIA PERSONALIZADA */}
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
                  {getCategoriaStyle(t.categoria).icon} {t.categoria}
                </div>

                <div
                  style={{
                    color: t.valor < 0 ? "#ef4444" : "#22c55e",
                    fontWeight: "bold"
                  }}
                >
                  {t.valor < 0 ? "-" : "+"}R$ {Math.abs(t.valor)}
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