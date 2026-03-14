import api from "./api";

export const listarGastos = async () => {
  const response = await api.get("/gastos/");
  return response.data;
};

export const resumoDashboard = async () => {
  const response = await api.get("/gastos/dashboard/resumo");
  return response.data;
};

export const gastosPorMes = async (mes) => {
  const response = await api.get(`/gastos/mes/${mes}`);
  return response.data;
};

export const gastosPorDia = async (dia) => {
  const response = await api.get(`/gastos/dia/${dia}`);
  return response.data;
};