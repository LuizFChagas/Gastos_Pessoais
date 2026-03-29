import { useEffect, useState } from "react";
import { listarGastos, deletarGasto } from "../api/gastosApi";
import AddTransactionForm from "../components/AddTransactionForm";

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

  const categorias = [
    "todos",
    ...new Set(transacoes.map((t) => t.categoria))
  ];

  const transacoesFiltradas = transacoes.filter((t) => {
    const matchCategoria =
      categoriaSelecionada === "todos" ||
      t.categoria === categoriaSelecionada;

    const matchBusca =
      t.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      t.banco?.toLowerCase().includes(busca.toLowerCase());

    return matchCategoria && matchBusca;
  });

  const getCategoriaStyle = (categoria) => {
    const map = {
      salario: { bg: "#d1fae5", color: "#065f46", icon: "💰" },
      alimentação: { bg: "#fef3c7", color: "#92400e", icon: "🍔" },
      transporte: { bg: "#dbeafe", color: "#1e40af", icon: "🚗" },
      moradia: { bg: "#e0e7ff", color: "#3730a3", icon: "🏠" },
      lazer: { bg: "#fce7f3", color: "#9d174d", icon: "🎮" },
      educação: { bg: "#ede9fe", color: "#5b21b6", icon: "📚" },
      saúde: { bg: "#fee2e2", color: "#991b1b", icon: "💊" },
      outros: { bg: "#e5e7eb", color: "#374151", icon: "🏷️" }
    };

    return map[categoria?.toLowerCase()] || map["outros"];
  };

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
          <h1 style={{ margin: 0 }}>Transações</h1>
          <span style={{ color: "#6b7280" }}>
            {transacoes.length} registros encontrados
          </span>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          style={{
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          + Nova
        </button>
      </div>

      {/* FILTROS */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginTop: "20px",
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "12px"
      }}>
        <input
          placeholder="🔍 Buscar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb"
          }}
        />

        <select
          value={categoriaSelecionada}
          onChange={(e) => setCategoriaSelecionada(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb"
          }}
        >
          {categorias.map((cat, index) => (
            <option key={index} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* LISTA */}
      <div style={{ marginTop: "20px" }}>
        {datasOrdenadas.map((data, index) => (
          <div key={index}>

            <div style={{
              margin: "20px 0 10px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#6b7280"
            }}>
              {formatarDataBonita(data)}
            </div>

            {agrupadoPorData[data].map((t, i) => (
              <div key={i} style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{
                    backgroundColor: "#ecfdf5",
                    padding: "10px",
                    borderRadius: "10px"
                  }}>
                    💰
                  </div>

                  <div>
                    <div style={{ fontWeight: "600" }}>
                      {t.descricao || "Sem descrição"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {t.banco || "Banco"}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginBottom: "5px",
                    backgroundColor: getCategoriaStyle(t.categoria).bg,
                    color: getCategoriaStyle(t.categoria).color
                  }}>
                    {getCategoriaStyle(t.categoria).icon} {t.categoria}
                  </div>

                  <div style={{
                    color: t.tipo === "saida" ? "#ef4444" : "#22c55e",
                    fontWeight: "bold"
                  }}>
                    {t.tipo === "saida" ? "-" : "+"}R$ {Math.abs(t.valor)}
                  </div>

                  <button
                    onClick={() => handleDeleteClick(t.id)}
                    style={{
                      marginTop: "5px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af"
                    }}
                  >
                    🗑️
                  </button>
                </div>

              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ✅ MODAL DELETE ORIGINAL (INTACTO) */}
      {openDeleteModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "16px",
            width: "350px",
            textAlign: "center"
          }}>
            <h3>Excluir transação</h3>
            <p style={{ color: "#6b7280" }}>
              Tem certeza que deseja excluir essa transação?
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setOpenDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#e5e7eb",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>

              <button
                onClick={confirmarDelete}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL NOVO (CORRIGIDO) */}
      {openModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "16px",
            width: "420px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px"
            }}>
              <h3>Nova transação</h3>

              <button
                onClick={() => setOpenModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <AddTransactionForm
              onSuccess={() => {
                setOpenModal(false);
                carregar();
              }}
              onCancel={() => setOpenModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Transacoes;