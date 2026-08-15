import api from "./api";

export const listarCategoriasPersonalizadas = async () => {
  const response = await api.get("/categorias/");
  return response.data;
};

export const criarCategoriaPersonalizada = async (nome, cor) => {
  const response = await api.post("/categorias/", { nome, cor });
  return response.data;
};

export const deletarCategoriaPersonalizada = async (id) => {
  await api.delete(`/categorias/${id}`);
};
