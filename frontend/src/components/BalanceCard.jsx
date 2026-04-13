function BalanceCard({ title, value, color }) {

  const formatar = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: "12px",
        padding: "20px",
        flex: 1,
        boxShadow: "var(--shadow-md)",
        borderLeft: `4px solid ${color}`,
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <span
        style={{
          color: "var(--subtext)",
          fontSize: "14px"
        }}
      >
        {title}
      </span>

      <strong
        style={{
          fontSize: "24px",
          marginTop: "8px",
          color: "var(--text)"
        }}
      >
        {formatar(value)}
      </strong>
    </div>
  );
}

export default BalanceCard;