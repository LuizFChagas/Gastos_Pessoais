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
