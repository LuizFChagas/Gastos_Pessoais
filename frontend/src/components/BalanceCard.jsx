function BalanceCard({ title, value, color }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
        borderLeft: `6px solid ${color}`,
        minWidth: "220px"
      }}
    >
      <p style={{ color: "#6b7280", fontSize: "14px" }}>
        {title}
      </p>

      <h2 style={{ marginTop: "10px" }}>
        {value}
      </h2>
    </div>
  );
}

export default BalanceCard;