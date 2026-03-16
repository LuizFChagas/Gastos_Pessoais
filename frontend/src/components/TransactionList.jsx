function TransactionList({ transactions }) {

  if (!transactions || transactions.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          marginTop: "30px"
        }}
      >
        <h2>Transações recentes</h2>
        <p>Nenhuma transação encontrada.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        marginTop: "30px"
      }}
    >
      <h2>Transações recentes</h2>

      <ul style={{ marginTop: "15px" }}>
        {transactions.map((t, index) => (
          <li key={index}>
            {t.descricao} — R$ {t.valor}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TransactionList;