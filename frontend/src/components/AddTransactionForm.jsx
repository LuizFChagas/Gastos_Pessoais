import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { CATEGORIAS, capitalizar } from "../utils/categorias";
import { useCategoriasPersonalizadas, LIMITE_CATEGORIAS_PERSONALIZADAS } from "../hooks/useCategoriasPersonalizadas";
import { ArrowUpCircle, ArrowDownCircle, ChevronDown, HelpCircle, Plus } from "lucide-react";

const NOVA_CATEGORIA_VALUE = "__nova_categoria__";

const CORES_CATEGORIA = [
  "#10b981", "#3b82f6", "#f97316", "#ec4899", "#8b5cf6",
  "#facc15", "#ef4444", "#14b8a6", "#6366f1", "#0ea5e9",
];

const FORMAS_PAGAMENTO = [
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];

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
          maxHeight: "260px", overflowY: "auto",
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: "14px",
                display: "flex", alignItems: "center", gap: "6px",
                color: opt.value === value ? "#10b981" : "var(--text)",
                fontWeight: opt.value === value ? "600" : "400",
                backgroundColor: opt.value === value ? "rgba(16,185,129,0.08)" : "transparent",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = opt.value === value ? "rgba(16,185,129,0.08)" : "transparent"; }}
            >
              {opt.dot && <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: opt.dot, flexShrink: 0 }} />}
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalNovaCategoria({ onClose, onCriada, criar }) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_CATEGORIA[0]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const confirmar = async () => {
    if (!nome.trim()) { setErro("Digite um nome"); return; }
    setSalvando(true);
    setErro("");
    try {
      const nova = await criar(nome.trim(), cor);
      onCriada(nova);
    } catch (e) {
      setErro(e?.response?.data?.detail || "Erro ao criar categoria");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}
    >
      <div style={{ backgroundColor: "var(--card)", padding: "24px", borderRadius: "18px", width: "min(340px, calc(100vw - 32px))", border: "1px solid var(--border)" }}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: "16px" }}>Nova categoria</h3>

        <label style={{ fontSize: "12px", fontWeight: "500", color: "var(--subtext)" }}>Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Faculdade dos filhos"
          maxLength={30}
          style={{ width: "100%", marginTop: "6px", padding: "10px 12px", height: "42px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "var(--input)", color: "var(--text)", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
        />

        <label style={{ fontSize: "12px", fontWeight: "500", color: "var(--subtext)", display: "block", marginTop: "14px" }}>Cor</label>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
          {CORES_CATEGORIA.map(c => (
            <button
              type="button"
              key={c}
              onClick={() => setCor(c)}
              style={{
                width: "28px", height: "28px", borderRadius: "50%", backgroundColor: c,
                border: cor === c ? "2px solid var(--text)" : "2px solid transparent",
                cursor: "pointer", padding: 0, boxShadow: cor === c ? "0 0 0 2px var(--card)" : "none"
              }}
            />
          ))}
        </div>

        {erro && <div style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px" }}>{erro}</div>}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--subtext)", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
          <button type="button" onClick={confirmar} disabled={salvando} style={{ flex: 2, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#10b981", color: "white", fontWeight: "700", cursor: salvando ? "default" : "pointer", opacity: salvando ? 0.7 : 1 }}>
            {salvando ? "Criando..." : "Criar categoria"}
          </button>
        </div>
      </div>
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
  const [formaPagamento, setFormaPagamento] = useState("");
  const [fixo, setFixo] = useState(false);
  const [parcelado, setParcelado] = useState(false);
  const [parcelas, setParcelas] = useState("2");
  const [openNovaCategoria, setOpenNovaCategoria] = useState(false);

  const { categoriasPersonalizadas, criar: criarCategoria } = useCategoriasPersonalizadas();

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

    if (parcelado && (!parcelas || Number(parcelas) < 2)) {
      alert("Informe o número de parcelas (mínimo 2)");
      return;
    }

    try {
      await api.post("/gastos/manual", {
        descricao,
        valor: valorNumerico,
        categoria,
        banco,
        data_hora: data || null,
        tipo,
        forma_pagamento: formaPagamento || null,
        fixo: parcelado ? false : fixo,
        parcelas: parcelado ? Number(parcelas) : null,
      });

      onSuccess();
    } catch (error) {
      alert(error?.response?.data?.detail || "Erro ao adicionar");
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

  const categoriaOptions = [
    ...CATEGORIAS.map(cat => ({ value: cat, label: capitalizar(cat) })),
    ...categoriasPersonalizadas.map(c => ({ value: c.nome, label: capitalizar(c.nome), dot: c.cor })),
    ...(categoriasPersonalizadas.length < LIMITE_CATEGORIAS_PERSONALIZADAS
      ? [{ value: NOVA_CATEGORIA_VALUE, label: "+ Nova categoria" }]
      : []),
  ];

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle}>Categoria</label>
            {categoriasPersonalizadas.length < LIMITE_CATEGORIAS_PERSONALIZADAS && (
              <button
                type="button"
                onClick={() => setOpenNovaCategoria(true)}
                title="Criar nova categoria"
                style={{
                  display: "flex", alignItems: "center", gap: "2px",
                  background: "transparent", border: "none", padding: 0,
                  color: "#10b981", fontSize: "11px", fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                <Plus size={12} /> Nova
              </button>
            )}
          </div>
          <CustomSelect
            value={categoria}
            onChange={(v) => {
              if (v === NOVA_CATEGORIA_VALUE) { setOpenNovaCategoria(true); return; }
              setCategoria(v);
            }}
            options={categoriaOptions}
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

      {/* FORMA DE PAGAMENTO */}
      <div>
        <label style={labelStyle}>Forma de pagamento <span style={{ fontWeight: 400 }}>(opcional)</span></label>
        <CustomSelect
          value={formaPagamento}
          onChange={setFormaPagamento}
          options={[{ value: "", label: "Não informar" }, ...FORMAS_PAGAMENTO]}
          inputStyle={inputStyle}
        />
      </div>

      {/* FIXO / PARCELADO */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text)", cursor: parcelado ? "default" : "pointer", opacity: parcelado ? 0.5 : 1 }}>
          <input type="checkbox" checked={fixo} disabled={parcelado} onChange={(e) => setFixo(e.target.checked)} style={{ accentColor: "#10b981", width: "16px", height: "16px" }} />
          Gasto fixo
          <span title="Repete essa transação automaticamente todo mês, sem precisar lançar de novo." style={{ display: "inline-flex", color: "var(--subtext)", cursor: "help" }}>
            <HelpCircle size={13} />
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text)", cursor: fixo ? "default" : "pointer", opacity: fixo ? 0.5 : 1 }}>
          <input type="checkbox" checked={parcelado} disabled={fixo} onChange={(e) => setParcelado(e.target.checked)} style={{ accentColor: "#10b981", width: "16px", height: "16px" }} />
          Parcelado
          <span title="Divide o valor em parcelas e gera automaticamente os lançamentos dos próximos meses." style={{ display: "inline-flex", color: "var(--subtext)", cursor: "help" }}>
            <HelpCircle size={13} />
          </span>
        </label>
        {parcelado && (
          <div style={{ marginLeft: "24px" }}>
            <label style={labelStyle}>Número de parcelas</label>
            <input
              type="number"
              min={2}
              max={48}
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
              style={{ ...inputStyle, width: "100px" }}
            />
          </div>
        )}
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

      {openNovaCategoria && (
        <ModalNovaCategoria
          criar={criarCategoria}
          onClose={() => setOpenNovaCategoria(false)}
          onCriada={(nova) => { setCategoria(nova.nome); setOpenNovaCategoria(false); }}
        />
      )}

    </form>
  );
}

export default AddTransactionForm;
