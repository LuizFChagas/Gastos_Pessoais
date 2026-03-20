import { useState } from "react";
import api from "../api/api";

function AddTransactionForm({ onSuccess }) {
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/gastos/manual",
        {
          descricao: form.descricao,
          valor: parseFloat(form.valor),
          categoria: form.categoria,
          data_hora: null // 🔥 alinhado com backend dele
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      alert("Gasto adicionado com sucesso!");

      // limpa o formulário
      setForm({
        descricao: "",
        valor: "",
        categoria: ""
      });

      // recarrega dashboard
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Erro ao adicionar gasto:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "30px",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        display: "flex",
        gap: "10px",
        alignItems: "center"
      }}
    >
      <input
        name="descricao"
        placeholder="Descrição"
        value={form.descricao}
        onChange={handleChange}
        style={{
          padding: "8px",
          borderRadius: "5px",
          border: "1px solid #ccc"
        }}
      />

      <input
        name="valor"
        placeholder="Valor"
        value={form.valor}
        onChange={handleChange}
        style={{
          padding: "8px",
          borderRadius: "5px",
          border: "1px solid #ccc"
        }}
      />

      <input
        name="categoria"
        placeholder="Categoria"
        value={form.categoria}
        onChange={handleChange}
        style={{
          padding: "8px",
          borderRadius: "5px",
          border: "1px solid #ccc"
        }}
      />

      <button
        type="submit"
        style={{
          padding: "10px 15px",
          backgroundColor: "#22c55e",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Salvar
      </button>
    </form>
  );
}

export default AddTransactionForm;