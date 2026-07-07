import api from "./api";

export const login = async (email, senha, rememberMe = false, captchaToken = "") => {
  const response = await api.post("/auth/login", {
    email,
    senha,
    remember_me: rememberMe,
    captcha_token: captchaToken,
  });
  return response.data;
};

export const cadastro = async (email, senha, nome, dataNascimento) => {
  const response = await api.post("/auth/cadastro", {
    email,
    senha,
    nome,
    data_nascimento: dataNascimento,
  });
  return response.data;
};

export const verificarOTP = async (email, codigo, rememberMe = false) => {
  const response = await api.post("/auth/verify-otp", {
    email,
    codigo,
    remember_me: rememberMe,
  });
  return response.data;
};

export const toggle2FA = async (ativar, senhaAtual) => {
  const response = await api.post("/auth/toggle-2fa", { ativar, senha_atual: senhaAtual });
  return response.data;
};

export const esqueceuSenha = async (email) => {
  const response = await api.post("/auth/esqueci-senha", { email });
  return response.data;
};

export const redefinirSenha = async (token, novaSenha) => {
  const response = await api.post("/auth/redefinir-senha", { token, nova_senha: novaSenha });
  return response.data;
};

export const verificarEmailToken = async (token) => {
  const response = await api.get(`/auth/verificar-email?token=${token}`);
  return response.data;
};
