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

// 🔥 NOVO FILTRO POR INTERVALO
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

// IMPORTAR EXTRATO (CSV)
export const importarExtrato = async (arquivo, banco) => {
  const formData = new FormData();
  formData.append("file", arquivo);
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

// DELETAR EXTRATO E SEUS GASTOS
export const deletarExtrato = async (id) => {
  await api.delete(`/gastos/extratos/${id}`);
};

// MESES QUE POSSUEM DADOS
export const listarMesesDisponiveis = async () => {
  const response = await api.get("/gastos/meses-disponiveis");
  return response.data;
};
