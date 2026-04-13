import { useState, useEffect } from "react";
import { importarExtrato, listarExtratos, deletarExtrato } from "../api/gastosApi";

function Importar() {
  const [arquivo, setArquivo] = useState(null);
  const [banco, setBanco] = useState("");
  const [step, setStep] = useState(1);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const data = await listarExtratos();
      setHistorico(data);
    } catch {
      // silencia erro de carregamento do histórico
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setArquivo(file);
    if (file) setStep(2);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    setArquivo(file);
    if (file) setStep(2);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleUpload = async () => {
    if (!arquivo) {
      alert("Selecione um arquivo primeiro");
      return;
    }

    setErro(null);
    setCarregando(true);
    setStep(3);

    try {
      await importarExtrato(arquivo, banco);
      await carregarHistorico();
      setStep(1);
      setArquivo(null);
      setBanco("");
    } catch (e) {
      const msg = e?.response?.data?.detail || "Erro ao processar o arquivo.";
      setErro(msg);
      setStep(2);
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarExtrato = async (id) => {
    if (!confirm("Deletar este extrato e todas as transações vinculadas a ele?")) return;
    try {
      await deletarExtrato(id);
      setHistorico((prev) => prev.filter((h) => h.id !== id));
    } catch {
      alert("Erro ao deletar extrato.");
    }
  };

  const StepCircle = ({ n }) => (
    <div style={{
      background: step >= n ? "#10b981" : "var(--border)",
      color: step >= n ? "white" : "var(--subtext)",
      borderRadius: "50%",
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "600",
      fontSize: "14px",
      flexShrink: 0,
      transition: "background 0.3s"
    }}>
      {n}
    </div>
  );

  return (
    <div>

      {/* HEADER */}
      <h1 style={{ marginBottom: "5px", color: "var(--text)" }}>Importar Extrato</h1>
      <p style={{ color: "var(--subtext)", marginBottom: "24px", margin: "0 0 24px" }}>
        Importe um arquivo CSV do seu extrato bancário
      </p>

      {/* STEPPER */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <StepCircle n={1} />
        <div style={{ width: "40px", height: "2px", background: step >= 2 ? "#10b981" : "var(--border)", transition: "background 0.3s" }} />
        <StepCircle n={2} />
        <div style={{ width: "40px", height: "2px", background: step >= 3 ? "#10b981" : "var(--border)", transition: "background 0.3s" }} />
        <StepCircle n={3} />
        <span style={{ marginLeft: "10px", color: "var(--subtext)", fontSize: "14px" }}>
          {step === 1 && "Selecionar arquivo"}
          {step === 2 && "Revisar informações"}
          {step === 3 && "Processando..."}
        </span>
      </div>

      {/* DROP AREA */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: `2px dashed ${arquivo ? "#10b981" : "var(--border)"}`,
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          backgroundColor: "var(--card)",
          cursor: "pointer",
          transition: "border-color 0.2s"
        }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="fileInput"
        />

        <label htmlFor="fileInput" style={{ cursor: "pointer" }}>
          <div style={{
            width: "48px", height: "48px",
            borderRadius: "12px",
            backgroundColor: arquivo ? "rgba(16,185,129,0.15)" : "var(--input)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
            fontSize: "22px",
            transition: "background 0.2s"
          }}>
            {arquivo ? "✅" : "📂"}
          </div>

          <div style={{ fontWeight: "600", color: "var(--text)", marginBottom: "4px", fontSize: "15px" }}>
            {arquivo ? arquivo.name : "Arraste ou clique para selecionar"}
          </div>

          <div style={{ fontSize: "12px", color: "var(--subtext)" }}>
            {arquivo ? "Arquivo selecionado" : "Suporta CSV"}
          </div>
        </label>

        {arquivo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setArquivo(null);
              setStep(1);
            }}
            style={{
              marginTop: "12px",
              background: "rgba(239,68,68,0.15)",
              color: "#ef4444",
              border: "none",
              borderRadius: "8px",
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            Remover
          </button>
        )}
      </div>

      {/* ERRO */}
      {erro && (
        <div style={{
          marginTop: "12px",
          padding: "10px 14px",
          background: "rgba(239,68,68,0.15)",
          color: "#ef4444",
          borderRadius: "8px",
          fontSize: "14px",
          border: "1px solid rgba(239,68,68,0.3)"
        }}>
          {erro}
        </div>
      )}

      {/* INPUT BANCO + BOTÃO */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <input
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
          placeholder="Ex: Nubank, Itaú, Bradesco..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--input)",
            color: "var(--text)",
            fontSize: "14px",
            outline: "none",
            fontFamily: "inherit"
          }}
        />

        <button
          onClick={handleUpload}
          disabled={carregando}
          style={{
            backgroundColor: carregando ? "var(--border)" : "#10b981",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: carregando ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            boxShadow: carregando ? "none" : "0 2px 12px rgba(16,185,129,0.35)"
          }}
        >
          {carregando ? "Processando..." : "⬆️ Processar"}
        </button>
      </div>

      {/* HISTÓRICO */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={{ color: "var(--text)", marginBottom: "16px" }}>Histórico</h3>

        {historico.length === 0 ? (
          <p style={{ color: "var(--subtext)" }}>Nenhum extrato enviado ainda.</p>
        ) : (
          historico.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--card)",
                padding: "14px 16px",
                borderRadius: "12px",
                marginBottom: "10px",
                border: "1px solid var(--border)"
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{
                  backgroundColor: "var(--input)",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "18px",
                  lineHeight: 1
                }}>
                  📄
                </div>

                <div>
                  <div style={{ fontWeight: "500", color: "var(--text)", fontSize: "14px" }}>
                    {item.nome_arquivo}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "2px" }}>
                    {item.banco || "Sem banco"} •{" "}
                    {new Date(item.data_importacao).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeletarExtrato(item.id)}
                style={{
                  background: "rgba(239,68,68,0.12)",
                  color: "#ef4444",
                  border: "none",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  transition: "background 0.2s"
                }}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default Importar;
