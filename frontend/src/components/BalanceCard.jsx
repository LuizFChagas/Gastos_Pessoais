function BalanceCard({ title, value, color }) {

  const formatar = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        flex: 1,
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        borderLeft: `6px solid ${color}`,
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <span
        style={{
          color: "#6b7280",
          fontSize: "14px"
        }}
      >
        {title}
      </span>

      <strong
        style={{
          fontSize: "24px",
          marginTop: "8px",
          color: "#111827"
        }}
      >
        {formatar(value)}
      </strong>
    </div>
  );
}

export default BalanceCard;