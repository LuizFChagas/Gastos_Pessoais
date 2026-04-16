import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { CATEGORIAS, getCategoriaStyle, capitalizar } from "../utils/categorias";
import { ArrowUpCircle, ArrowDownCircle, ChevronDown } from "lucide-react";

function CustomSelect({ value, onChange, options, inputStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle,
          marginTop: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "6px", cursor: "pointer", textAlign: "left",
          transition: "border-color 0.2s", outline: "none",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#10b981"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 200,
          backgroundColor: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "10px", overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: "14px",
                color: opt.value === value ? "#10b981" : "var(--text)",
                fontWeight: opt.value === value ? "600" : "400",
                backgroundColor: opt.value === value ? "rgba(16,185,129,0.08)" : "transparent",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = opt.value === value ? "rgba(16,185,129,0.08)" : "transparent"; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><ArrowUpCircle size={14} /> Saída</span>
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><ArrowDownCircle size={14} /> Entrada</span>
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
          <CustomSelect
            value={categoria}
            onChange={(v) => setCategoria(v)}
            options={CATEGORIAS.map(cat => ({ value: cat, label: capitalizar(cat) }))}
            inputStyle={inputStyle}
          />
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
