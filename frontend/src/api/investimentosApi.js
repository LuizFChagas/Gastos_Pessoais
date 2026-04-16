import api from "./api";

export const listarInvestimentos = async () => {
  const res = await api.get("/investimentos/");
  return res.data;
};

export const criarInvestimento = async (dados) => {
  const res = await api.post("/investimentos/", dados);
  return res.data;
};

export const editarInvestimento = async (id, dados) => {
  const res = await api.put(`/investimentos/${id}`, dados);
  return res.data;
};

export const deletarInvestimento = async (id) => {
  await api.delete(`/investimentos/${id}`);
};

// ── Aportes ──────────────────────────────────────────────────

export const listarAportes = async (invId) => {
  const res = await api.get(`/investimentos/${invId}/aportes`);
  return res.data;
};

export const criarAporte = async (invId, dados) => {
  const res = await api.post(`/investimentos/${invId}/aportes`, dados);
  return res.data;
};

export const deletarAporte = async (aporteId) => {
  await api.delete(`/investimentos/aportes/${aporteId}`);
};
