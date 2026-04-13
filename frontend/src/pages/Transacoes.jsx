import { useEffect, useState } from "react";
import { listarGastos, deletarGasto } from "../api/gastosApi";
import AddTransactionForm from "../components/AddTransactionForm";
import { CATEGORIAS, getCategoriaStyle, capitalizar } from "../utils/categorias";

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [busca, setBusca] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [gastoSelecionado, setGastoSelecionado] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      const data = await listarGastos();
      setTransacoes(data);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setGastoSelecionado(id);
    setOpenDeleteModal(true);
  };

  const confirmarDelete = async () => {
    try {
      await deletarGasto(gastoSelecionado);
      setOpenDeleteModal(false);
      carregar();
    } catch {
      alert("Erro ao excluir");
    }
  };

  const categorias = ["todos", ...CATEGORIAS];

  const transacoesFiltradas = transacoes.filter((t) => {
    const matchCategoria =
      categoriaSelecionada === "todos" ||
      (t.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase());

    const matchBusca =
      t.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      t.banco?.toLowerCase().includes(busca.toLowerCase());

    return matchCategoria && matchBusca;
  });

  const formatarDataBonita = (dataStr) => {
    const [ano, mes, dia] = dataStr.split("-");
    const data = new Date(ano, mes - 1, dia);

    const dias = [
      "domingo", "segunda-feira", "terça-feira",
      "quarta-feira", "quinta-feira", "sexta-feira", "sábado"
    ];
    const meses = [
      "janeiro", "fevereiro", "março", "abril",
      "maio", "junho", "julho", "agosto",
      "setembro", "outubro", "novembro", "dezembro"
    ];

    return `${dias[data.getDay()].toUpperCase()}, ${dia} DE ${meses[data.getMonth()].toUpperCase()}`;
  };

  const agrupadoPorData = transacoesFiltradas.reduce((acc, t) => {
    const data = t.data_hora?.split("T")[0];
    if (!acc[data]) acc[data] = [];
    acc[data].push(t);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(agrupadoPorData)
    .sort((a, b) => new Date(b) - new Date(a));

  return (
    <div>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Transações</h1>
          <span style={{ color: "var(--subtext)" }}>
            {transacoes.length} registros encontrados
          </span>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          style={{
            backgroundColor: "#10b981", color: "white", border: "none",
            padding: "10px 20px", borderRadius: "10px",
            fontWeight: "bold", cursor: "pointer"
          }}
        >
          + Nova
        </button>
      </div>

      {/* FILTROS */}
      <div style={{
        display: "flex", gap: "10px", marginTop: "20px",
        backgroundColor: "var(--card)", padding: "15px", borderRadius: "12px"
      }}>
        <input
          placeholder="🔍 Buscar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            flex: 1, padding: "10px", borderRadius: "10px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--input)", color: "var(--text)"
          }}
        />

        <select
          value={categoriaSelecionada}
          onChange={(e) => setCategoriaSelecionada(e.target.value)}
          style={{
            padding: "10px", borderRadius: "10px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--input)", color: "var(--text)"
          }}
        >
          {categorias.map((cat, index) => (
            <option key={index} value={cat}>
              {cat === "todos" ? "Todas" : capitalizar(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* LISTA AGRUPADA POR DATA */}
      <div style={{ marginTop: "20px" }}>
        {datasOrdenadas.map((data, index) => (
          <div key={index}>
            <div style={{
              margin: "20px 0 10px", fontSize: "13px",
              fontWeight: "700", color: "var(--subtext)"
            }}>
              {formatarDataBonita(data)}
            </div>

            {agrupadoPorData[data].map((t, i) => {
              const isEstorno = t.tipo === "saida" && t.valor < 0;
              const isEntrada = t.tipo === "entrada";
              const style = getCategoriaStyle(t.categoria);

              return (
                <div key={i} style={{
                  backgroundColor: "var(--card)", padding: "15px",
                  borderRadius: "12px", marginBottom: "10px",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                      backgroundColor: isEstorno
                        ? "rgba(148,163,184,0.15)"
                        : isEntrada
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(239,68,68,0.15)",
                      padding: "10px", borderRadius: "10px", fontSize: "18px"
                    }}>
                      {isEstorno ? "↩️" : isEntrada ? "💰" : "💸"}
                    </div>

                    <div>
                      <div style={{ fontWeight: "600", color: "var(--text)" }}>
                        {t.descricao || "Sem descrição"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--subtext)" }}>
                        {t.banco || "Banco"}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginBottom: "5px" }}>
                      {isEstorno && (
                        <span style={{
                          fontSize: "10px", fontWeight: "600",
                          padding: "2px 7px", borderRadius: "999px",
                          backgroundColor: "rgba(34,197,94,0.12)",
                          color: "#22c55e",
                          border: "1px solid rgba(34,197,94,0.3)",
                          whiteSpace: "nowrap"
                        }}>
                          ↩ Estorno
                        </span>
                      )}
                      {t.descricao?.startsWith("Pix") && (
                        <span style={{
                          fontSize: "10px", fontWeight: "600",
                          padding: "2px 7px", borderRadius: "999px",
                          backgroundColor: "rgba(139,92,246,0.12)",
                          color: "#a78bfa",
                          border: "1px solid rgba(139,92,246,0.3)",
                          whiteSpace: "nowrap"
                        }}>
                          ⚡ Pix
                        </span>
                      )}
                      {t.banco?.toLowerCase().includes("fatura") && (
                        <span style={{
                          fontSize: "10px", fontWeight: "600",
                          padding: "2px 7px", borderRadius: "999px",
                          backgroundColor: "rgba(59,130,246,0.12)",
                          color: "#60a5fa",
                          border: "1px solid rgba(59,130,246,0.3)",
                          whiteSpace: "nowrap"
                        }}>
                          💳 Cartão
                        </span>
                      )}
                      {t.data_original && (
                        <span style={{
                          fontSize: "10px", fontWeight: "600",
                          padding: "2px 7px", borderRadius: "999px",
                          backgroundColor: "rgba(251,191,36,0.15)",
                          color: "#f59e0b",
                          border: "1px solid rgba(251,191,36,0.3)",
                          whiteSpace: "nowrap"
                        }}>
                          📅 {new Date(t.data_original).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "4px 10px", borderRadius: "999px",
                        fontSize: "12px", fontWeight: "500",
                        backgroundColor: style.bg, color: style.color
                      }}>
                        {style.icon} {capitalizar(t.categoria)}
                      </div>
                    </div>

                    <div style={{
                      color: isEstorno ? "var(--subtext)" : isEntrada ? "#22c55e" : "#ef4444",
                      fontWeight: "bold",
                      textDecoration: isEstorno ? "line-through" : "none"
                    }}>
                      R$ {Math.abs(t.valor).toFixed(2)}
                    </div>

                    <button
                      onClick={() => handleDeleteClick(t.id)}
                      style={{
                        marginTop: "5px", background: "transparent",
                        border: "none", cursor: "pointer", color: "#9ca3af"
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* MODAL DELETE */}
      {openDeleteModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            backgroundColor: "var(--card)", padding: "25px",
            borderRadius: "16px", width: "350px", textAlign: "center"
          }}>
            <h3 style={{ color: "var(--text)" }}>Excluir transação</h3>
            <p style={{ color: "var(--subtext)" }}>
              Tem certeza que deseja excluir essa transação?
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setOpenDeleteModal(false)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "none", backgroundColor: "var(--border)",
                  color: "var(--text)", fontWeight: "600", cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDelete}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "none", backgroundColor: "#dc2626",
                  color: "white", fontWeight: "bold", cursor: "pointer"
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA TRANSAÇÃO */}
      {openModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            backgroundColor: "var(--card)", padding: "25px",
            borderRadius: "16px", width: "420px"
          }}>
            <AddTransactionForm
              onSuccess={() => { setOpenModal(false); carregar(); }}
              onCancel={() => setOpenModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Transacoes;
