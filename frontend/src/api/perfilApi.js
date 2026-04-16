import api from "./api";

export const getPerfil = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};
