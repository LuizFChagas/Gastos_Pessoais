import api from "./api";

export const listarGastos = async () => {
  const response = await api.get("/gastos/mes");
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