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

  const handleDragOver = (e) => {
    e.preventDefault();
  };

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

  return (
    <div>

      {/* HEADER */}
      <h1 style={{ marginBottom: "5px" }}>Importar Extrato</h1>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        Importe um arquivo CSV, PDF ou imagem do seu extrato bancário
      </p>

      {/* STEPPER */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>

        <div style={{
          background: step >= 1 ? "#10b981" : "#e5e7eb",
          color: "white",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          1
        </div>

        <div style={{ width: "40px", height: "2px", background: "#e5e7eb" }} />

        <div style={{
          background: step >= 2 ? "#10b981" : "#e5e7eb",
          color: step >= 2 ? "white" : "transparent",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          2
        </div>

        <div style={{ width: "40px", height: "2px", background: "#e5e7eb" }} />

        <div style={{
          background: step >= 3 ? "#10b981" : "#e5e7eb",
          color: step >= 3 ? "white" : "transparent",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          3
        </div>

        <span style={{ marginLeft: "10px", color: "#6b7280" }}>
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
          border: "2px dashed #d1d5db",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          cursor: "pointer"
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
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>⬆️</div>

          <div style={{ fontWeight: "600", marginBottom: "5px" }}>
            Arraste ou clique para selecionar
          </div>

          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            Suporta CSV, PDF, imagens e XLSX
          </div>
        </label>

        {arquivo && (
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "#10b981"
            }}
          >
            ✔ {arquivo.name}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setArquivo(null);
                setStep(1);
              }}
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border: "none",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ERRO */}
      {erro && (
        <div style={{
          marginTop: "12px",
          padding: "10px 14px",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          {erro}
        </div>
      )}

      {/* INPUT + BOTÃO */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <input
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
          placeholder="Ex: Nubank, Itaú, Bradesco..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb"
          }}
        />

        <button
          onClick={handleUpload}
          disabled={carregando}
          style={{
            backgroundColor: carregando ? "#6b7280" : "#10b981",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: carregando ? "not-allowed" : "pointer"
          }}
        >
          {carregando ? "Processando..." : "⬆️ Processar"}
        </button>
      </div>

      {/* HISTÓRICO */}
      <div style={{ marginTop: "40px" }}>
        <h3>Histórico</h3>

        {historico.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Nenhum extrato enviado ainda.</p>
        ) : (
          historico.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "white",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "10px",
                border: "1px solid #e5e7eb"
              }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div
                  style={{
                    backgroundColor: "#e5e7eb",
                    padding: "8px",
                    borderRadius: "8px"
                  }}
                >
                  📄
                </div>

                <div>
                  <div style={{ fontWeight: "500" }}>{item.nome_arquivo}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {item.banco || "Sem banco"} •{" "}
                    {new Date(item.data_importacao).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeletarExtrato(item.id)}
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  cursor: "pointer"
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
