import { useState } from "react";
import api from "../api/api";
import { CATEGORIAS } from "../utils/categorias";

function AddTransactionForm({ onSuccess, onCancel }) {
  const [tipo, setTipo] = useState("saida");
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("outros");
  const [banco, setBanco] = useState("");
  const [nota, setNota] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!valor || !descricao || !banco) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const valorNumerico = Number(valor);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert("Digite um valor válido");
      return;
    }

    try {
      await api.post("/gastos/manual", {
        descricao,
        valor: valorNumerico,
        categoria,
        banco,
        data_hora: data || null,
        tipo
      });

      onSuccess();
    } catch (error) {
      console.log(error);
      alert("Erro ao adicionar");
    }
  };

  // ✅ INPUT CORRIGIDO
  const inputStyle = {
    width: "100%",
    marginTop: "5px",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    boxSizing: "border-box",
    backgroundColor: "var(--input)",
    color: "#111827", // 🔥 força texto visível
    appearance: "none"
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >

      {/* TOGGLE */}
      <div
        style={{
          position: "relative",
          display: "flex",
          backgroundColor: "var(--input)",
          borderRadius: "12px",
          padding: "4px"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: tipo === "saida" ? "4px" : "50%",
            width: "calc(50% - 4px)",
            height: "calc(100% - 8px)",
            backgroundColor: tipo === "saida" ? "#ef4444" : "#22c55e",
            borderRadius: "10px",
            transition: "all 0.3s ease"
          }}
        />

        <div
          onClick={() => setTipo("saida")}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "10px",
            cursor: "pointer",
            zIndex: 1,
            color: tipo === "saida" ? "white" : "#111827",
            fontWeight: "600"
          }}
        >
          💸 Saída
        </div>

        <div
          onClick={() => setTipo("entrada")}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "10px",
            cursor: "pointer",
            zIndex: 1,
            color: tipo === "entrada" ? "white" : "#111827",
            fontWeight: "600"
          }}
        >
          💰 Entrada
        </div>
      </div>

      {/* DATA + VALOR */}
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "13px", color: "var(--subtext)" }}>
            Data
          </label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "13px", color: "var(--subtext)" }}>
            Valor (R$)
          </label>
          <input
            type="text"
            placeholder="0.00"
            value={valor}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val)) {
                setValor(val);
              }
            }}
            style={{
              ...inputStyle,
              borderColor: tipo === "saida" ? "#ef4444" : "#22c55e"
            }}
          />
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div>
        <label style={{ fontSize: "13px", color: "var(--subtext)" }}>
          Descrição
        </label>
        <input
          placeholder="Ex: Mercado, Salário..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* CATEGORIA + BANCO */}
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "13px", color: "var(--subtext)" }}>
            Categoria
          </label>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{
              ...inputStyle,
              color: "#111827"
            }}
          >
            {CATEGORIAS.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "13px", color: "var(--subtext)" }}>
            Banco
          </label>
          <input
            placeholder="Ex: Nubank..."
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* NOTA */}
      <div>
        <label style={{ fontSize: "13px", color: "var(--subtext)" }}>
          Nota (opcional)
        </label>
        <input
          placeholder="Observação..."
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* BOTÕES */}
      <div style={{ display: "flex", gap: "12px", marginTop: "5px" }}>
        
        {/* 🔥 CANCELAR VERMELHO FIXO */}
        <button
          type="button"
          onClick={() => onCancel && onCancel()}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#ef4444",
            color: "white",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Cancelar
        </button>

        <button
          type="submit"
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#10b981",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Adicionar
        </button>
      </div>

    </form>
  );
}

export default AddTransactionForm;