import { useState, useEffect } from "react";
import { importarExtrato, previewExtrato, listarExtratos, deletarExtrato } from "../api/gastosApi";
import { FolderOpen, Upload, Trash2, CheckCircle, AlertTriangle, FileText, Download } from "lucide-react";

const MODELO_CSV = "Data,Descricao,Valor\n01/08/2026,Exemplo Supermercado,150.00\n02/08/2026,Exemplo Assinatura,39.90\n";

const baixarModeloCsv = () => {
  const blob = new Blob([MODELO_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-importacao-finly.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtData = (iso) => {
  const [ano, mes, dia] = (iso || "").split("-");
  return dia ? `${dia}/${mes}/${ano}` : iso;
};

function Importar() {
  const [arquivo, setArquivo] = useState(null);
  const [banco, setBanco] = useState("");
  const [step, setStep] = useState(1);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const [preview, setPreview] = useState(null);
  const [carregandoPreview, setCarregandoPreview] = useState(false);
  const [erroPreview, setErroPreview] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState(null); // "fatura" | "extrato" — null até o preview detectar

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

  const selecionarArquivo = (file) => {
    if (!file) return;
    setArquivo(file);
    setStep(2);
    setTipoDocumento(null);
    buscarPreview(file, null);
  };

  const handleFileChange = (e) => selecionarArquivo(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); selecionarArquivo(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => e.preventDefault();

  const buscarPreview = async (file, tipoDocumentoEscolhido) => {
    setPreview(null);
    setErroPreview(null);
    setCarregandoPreview(true);
    try {
      const data = await previewExtrato(file, tipoDocumentoEscolhido);
      setPreview(data);
      // só adota o palpite automático se o usuário ainda não escolheu manualmente
      if (!tipoDocumentoEscolhido) setTipoDocumento(data.tipo_documento_detectado);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Não foi possível ler esse arquivo.";
      setErroPreview(msg);
    } finally {
      setCarregandoPreview(false);
    }
  };

  const escolherTipoDocumento = (tipo) => {
    setTipoDocumento(tipo);
    if (arquivo) buscarPreview(arquivo, tipo);
  };

  const cancelarArquivo = () => {
    setArquivo(null);
    setPreview(null);
    setErroPreview(null);
    setTipoDocumento(null);
    setStep(1);
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
      await importarExtrato(arquivo, banco, tipoDocumento);
      await carregarHistorico();
      setStep(1);
      setArquivo(null);
      setBanco("");
      setPreview(null);
      setTipoDocumento(null);
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
      <p style={{ color: "var(--subtext)", margin: "0 0 10px" }}>
        Importe um arquivo CSV do seu extrato bancário
      </p>
      <button
        onClick={baixarModeloCsv}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "none", border: "none", padding: 0,
          color: "#10b981", fontSize: "13px", fontWeight: "600",
          cursor: "pointer", marginBottom: "24px"
        }}
      >
        <Download size={14} /> Seu banco não exporta CSV? Baixe um modelo em branco
      </button>

      {/* STEPPER */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <StepCircle n={1} />
        <div style={{ width: "40px", height: "2px", background: step >= 2 ? "#10b981" : "var(--border)", transition: "background 0.3s" }} />
        <StepCircle n={2} />
        <div style={{ width: "40px", height: "2px", background: step >= 3 ? "#10b981" : "var(--border)", transition: "background 0.3s" }} />
        <StepCircle n={3} />
        <span style={{ marginLeft: "10px", color: "var(--subtext)", fontSize: "14px" }}>
          {step === 1 && "Selecionar arquivo"}
          {step === 2 && "Conferir transações"}
          {step === 3 && "Importando..."}
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
            transition: "background 0.2s"
          }}>
            {arquivo ? <CheckCircle size={22} color="#10b981" /> : <FolderOpen size={22} color="var(--subtext)" />}
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
              cancelarArquivo();
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

      {/* PREVIEW — ANALISANDO */}
      {carregandoPreview && (
        <div style={{
          marginTop: "16px", padding: "16px", textAlign: "center",
          color: "var(--subtext)", fontSize: "14px"
        }}>
          Analisando arquivo...
        </div>
      )}

      {/* PREVIEW — ERRO (formato não reconhecido) */}
      {erroPreview && (
        <div style={{
          marginTop: "16px", padding: "14px 16px", borderRadius: "12px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#ef4444", fontSize: "14px", display: "flex", gap: "10px", alignItems: "flex-start"
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{erroPreview}</span>
        </div>
      )}

      {/* PREVIEW — NENHUMA TRANSAÇÃO ENCONTRADA */}
      {preview && preview.total === 0 && (
        <div style={{
          marginTop: "16px", padding: "14px 16px", borderRadius: "12px",
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          color: "#f59e0b", fontSize: "14px", display: "flex", gap: "10px", alignItems: "flex-start"
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>Nenhuma transação foi reconhecida nesse arquivo. Confira se é o arquivo certo antes de tentar outro banco.</span>
        </div>
      )}

      {/* PREVIEW — TABELA DE CONFERÊNCIA */}
      {preview && preview.total > 0 && (
        <div style={{
          marginTop: "16px", backgroundColor: "var(--card)", borderRadius: "12px",
          border: "1px solid var(--border)", overflow: "hidden"
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>
              {preview.total} transaç{preview.total === 1 ? "ão encontrada" : "ões encontradas"}
            </span>
            {preview.formato === "generico" && (
              <span style={{ fontSize: "11px", color: "#f59e0b" }}>
                Banco detectado automaticamente — confira os valores abaixo
              </span>
            )}
          </div>

          {/* TIPO DE DOCUMENTO — fatura força tudo pra crédito; extrato mantém Pix/débito por transação */}
          <div style={{
            padding: "10px 16px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"
          }}>
            <span style={{ fontSize: "12px", color: "var(--subtext)" }}>Isso é:</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { valor: "extrato", rotulo: "Extrato bancário (Pix/Débito)" },
                { valor: "fatura", rotulo: "Fatura de cartão (Crédito)" },
              ].map(({ valor, rotulo }) => (
                <button
                  key={valor}
                  onClick={() => escolherTipoDocumento(valor)}
                  disabled={carregandoPreview}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${tipoDocumento === valor ? "#10b981" : "var(--border)"}`,
                    background: tipoDocumento === valor ? "rgba(16,185,129,0.15)" : "var(--input)",
                    color: tipoDocumento === valor ? "#10b981" : "var(--subtext)",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: carregandoPreview ? "not-allowed" : "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          {/* AVISOS — ex: fatura com transação marcada como entrada (incomum) */}
          {preview.avisos && preview.avisos.length > 0 && (
            <div style={{
              padding: "10px 16px", borderBottom: "1px solid var(--border)",
              background: "rgba(245,158,11,0.1)", display: "flex", flexDirection: "column", gap: "6px"
            }}>
              {preview.avisos.map((aviso, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", color: "#f59e0b" }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span>{aviso}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ maxHeight: "280px", overflowY: "auto" }}>
            {preview.transacoes.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 16px",
                  borderBottom: i < preview.transacoes.length - 1 ? "1px solid var(--border)" : "none"
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--subtext)", flexShrink: 0, width: "62px" }}>
                  {fmtData(t.data)}
                </span>
                <span style={{
                  fontSize: "13px", color: "var(--text)", flex: 1, minWidth: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {t.descricao}
                </span>
                <span style={{
                  fontSize: "13px", fontWeight: "600", flexShrink: 0,
                  color: t.tipo === "entrada" ? "#22c55e" : "#ef4444"
                }}>
                  {t.tipo === "entrada" ? "+" : "-"}{fmtMoeda(t.valor)}
                </span>
              </div>
            ))}
          </div>
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
          disabled={carregando || carregandoPreview || !preview || preview.total === 0}
          style={{
            backgroundColor: (carregando || carregandoPreview || !preview || preview.total === 0) ? "var(--border)" : "#10b981",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: (carregando || carregandoPreview || !preview || preview.total === 0) ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            boxShadow: (carregando || carregandoPreview || !preview || preview.total === 0) ? "none" : "0 2px 12px rgba(16,185,129,0.35)"
          }}
        >
          {carregando ? "Importando..." : <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Upload size={15} /> Confirmar importação</span>}
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
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: 0 }}>
                <div style={{
                  backgroundColor: "var(--input)",
                  padding: "8px",
                  borderRadius: "8px",
                  lineHeight: 1,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text)"
                }}>
                  <FileText size={18} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: "500", color: "var(--text)", fontSize: "14px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
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
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default Importar;
