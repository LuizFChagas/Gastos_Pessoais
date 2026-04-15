import api from "./api";

// LOGIN
export const login = async (email, senha, rememberMe = false) => {
  const response = await api.post("/auth/login", {
    email,
    senha,
    remember_me: rememberMe
  });

  return response.data;
};

// CADASTRO
export const cadastro = async (email, senha, nome, dataNascimento) => {
  const response = await api.post("/auth/cadastro", {
    email,
    senha,
    nome,
    data_nascimento: dataNascimento
  });

  return response.data;
};