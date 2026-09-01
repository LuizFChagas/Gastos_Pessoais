import api from "./api";

export const listarGastos = async () => {
  const response = await api.get("/gastos"); 
  return response.data;
};

export const resumoDashboard = async () => {
  const response = await api.get("/gastos/dashboard/resumo");
  return response.data;
};

export const gastosPorMes = async () => {
  const response = await api.get("/gastos/mes");
  return response.data;
};

export const gastosPorDia = async () => {
  const response = await api.get("/gastos/por-dia");
  return response.data;
};

export const gastosPorCategoria = async () => {
  const response = await api.get("/gastos/por-categoria");
  return response.data;
};

// NOVO FILTRO POR INTERVALO
export const gastosPorIntervalo = async (dataInicio, dataFim) => {
  const response = await api.get("/gastos/intervalo", {
    params: {
      data_inicio: dataInicio,
      data_fim: dataFim
    }
  });

  return response.data;
};

// DELETE
export const deletarGasto = async (id) => {
  await api.delete(`/gastos/${id}`);
};

// PRÉ-VISUALIZAR EXTRATO (CSV) — não salva nada, só mostra o que seria importado
// tipoDocumento: "fatura" | "extrato" | null (null = deixa o backend detectar sozinho)
export const previewExtrato = async (arquivo, tipoDocumento = null) => {
  const formData = new FormData();
  formData.append("file", arquivo);
  if (tipoDocumento) formData.append("tipo_documento", tipoDocumento);
  const response = await api.post("/gastos/importar/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// IMPORTAR EXTRATO (CSV)
export const importarExtrato = async (arquivo, banco, tipoDocumento = null) => {
  const formData = new FormData();
  formData.append("file", arquivo);
  if (tipoDocumento) formData.append("tipo_documento", tipoDocumento);
  const response = await api.post(`/gastos/importar?banco=${encodeURIComponent(banco)}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

// LISTAR HISTÓRICO DE EXTRATOS
export const listarExtratos = async () => {
  const response = await api.get("/gastos/extratos");
  return response.data;
};

// MESES COM DADOS DISPONÍVEIS
export const listarMesesDisponiveis = async () => {
  const response = await api.get("/gastos/meses-disponiveis");
  return response.data;
};

// DELETAR EXTRATO E SEUS GASTOS
export const deletarExtrato = async (id) => {
  await api.delete(`/gastos/extratos/${id}`);
};

// EDITAR TRANSAÇÃO
export const editarGasto = async (id, dados) => {
  const response = await api.put(`/gastos/${id}`, dados);
  return response.data;
};

// RECATEGORIZAR EM LOTE
export const recategorizarLote = async (ids, categoria) => {
  const response = await api.put("/gastos/recategorizar-lote", { ids, categoria });
  return response.data;
};

// AJUSTAR SALDO MANUALMENTE
export const ajustarSaldo = async (novoSaldo, motivo) => {
  const response = await api.post("/gastos/ajuste-saldo", { novo_saldo: novoSaldo, motivo });
  return response.data;
};

// EXPORTAR TRANSAÇÕES (csv | xlsx | pdf) — dispara o download no navegador
export const exportarGastos = async (formato) => {
  const response = await api.get("/gastos/exportar", {
    params: { formato },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `finly_transacoes.${formato}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

