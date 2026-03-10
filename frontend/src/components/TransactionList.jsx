function TransactionList() {

  const transactions = [
    { descricao: "Mercado", valor: -120 },
    { descricao: "Salário", valor: 3000 },
    { descricao: "Uber", valor: -45 },
    { descricao: "Netflix", valor: -39 }
  ];

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