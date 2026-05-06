import api from "./api";

export const enviarSugestao = async (texto) => {
  const { data } = await api.post("/sugestoes", { texto });
  return data;
};
