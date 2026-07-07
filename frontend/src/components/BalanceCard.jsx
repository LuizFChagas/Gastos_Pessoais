function BalanceCard({ title, value, color, extraStyle = {}, isMobile = false }) {

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
        padding: isMobile ? "16px" : "24px 24px",
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        boxShadow: "var(--shadow-md)",
        borderLeft: `4px solid ${color}`,
        minHeight: isMobile ? "80px" : "115px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        ...extraStyle
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
          fontSize: "clamp(16px, 4vw, 24px)",
          marginTop: "8px",
          color: "var(--text)",
          wordBreak: "break-word"
        }}
      >
        {formatar(value)}
      </strong>
    </div>
  );
}

export default BalanceCard;