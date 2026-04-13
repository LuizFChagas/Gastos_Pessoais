import { useState } from "react";
import api from "../api/api";
import { CATEGORIAS, getCategoriaStyle, capitalizar } from "../utils/categorias";

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

  const accentColor = tipo === "saida" ? "#ef4444" : "#22c55e";

  const inputStyle = {
    width: "100%",
    marginTop: "6px",
    padding: "10px 12px",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    boxSizing: "border-box",
    backgroundColor: "var(--input)",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    appearance: "none",
    transition: "border-color 0.2s"
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--subtext)",
    letterSpacing: "0.3px"
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* TOGGLE ENTRADA / SAÍDA */}
      <div style={{
        position: "relative",
        display: "flex",
        backgroundColor: "var(--input)",
        borderRadius: "12px",
        padding: "4px"
      }}>
        <div style={{
          position: "absolute",
          top: "4px",
          left: tipo === "saida" ? "4px" : "50%",
          width: "calc(50% - 4px)",
          height: "calc(100% - 8px)",
          backgroundColor: accentColor,
          borderRadius: "10px",
          transition: "all 0.25s ease",
          boxShadow: `0 2px 8px ${accentColor}55`
        }} />

        <div
          onClick={() => setTipo("saida")}
          style={{
            flex: 1, textAlign: "center", padding: "10px",
            cursor: "pointer", zIndex: 1,
            color: tipo === "saida" ? "white" : "var(--subtext)",
            fontWeight: "600", fontSize: "14px",
            transition: "color 0.2s"
          }}
        >
          💸 Saída
        </div>

        <div
          onClick={() => setTipo("entrada")}
          style={{
            flex: 1, textAlign: "center", padding: "10px",
            cursor: "pointer", zIndex: 1,
            color: tipo === "entrada" ? "white" : "var(--subtext)",
            fontWeight: "600", fontSize: "14px",
            transition: "color 0.2s"
          }}
        >
          💰 Entrada
        </div>
      </div>

      {/* DATA + VALOR */}
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Valor (R$)</label>
          <input
            type="text"
            placeholder="0,00"
            value={valor}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val)) setValor(val);
            }}
            style={{
              ...inputStyle,
              borderColor: valor ? accentColor : "var(--border)",
              fontWeight: valor ? "600" : "400"
            }}
          />
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div>
        <label style={labelStyle}>Descrição</label>
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
          <label style={labelStyle}>Categoria</label>
          <div style={{ position: "relative", marginTop: "6px" }}>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={{ ...inputStyle, marginTop: 0, paddingRight: "32px" }}
            >
              {CATEGORIAS.map((cat, index) => (
                <option key={index} value={cat}>
                  {getCategoriaStyle(cat).icon} {capitalizar(cat)}
                </option>
              ))}
            </select>
            <svg
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none"
              }}
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="var(--subtext)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Banco</label>
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
        <label style={labelStyle}>Nota <span style={{ color: "var(--subtext)", fontWeight: 400 }}>(opcional)</span></label>
        <input
          placeholder="Observação..."
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* BOTÕES */}
      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
        <button
          type="button"
          onClick={() => onCancel && onCancel()}
          style={{
            flex: 1, padding: "12px", borderRadius: "12px",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "var(--subtext)", fontWeight: "600",
            fontSize: "14px", cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s"
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{
            flex: 2, padding: "12px", borderRadius: "12px",
            border: "none",
            backgroundColor: accentColor,
            color: "white", fontWeight: "700",
            fontSize: "14px", cursor: "pointer",
            boxShadow: `0 2px 12px ${accentColor}55`,
            transition: "background-color 0.2s, box-shadow 0.2s"
          }}
        >
          Adicionar {tipo === "saida" ? "Saída" : "Entrada"}
        </button>
      </div>

    </form>
  );
}

export default AddTransactionForm;
