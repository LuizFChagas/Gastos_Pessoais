import API_URL from "./api"

export async function login(email, senha) {

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      senha
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Erro no login")
  }

  localStorage.setItem("token", data.access_token)

  return data
}

export async function cadastro(email, senha) {

  const response = await fetch(`${API_URL}/auth/cadastro`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      senha
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Erro ao cadastrar")
  }

  return data
}

export function logout() {
  localStorage.removeItem("token")
}

export function usuarioLogado() {
  return !!localStorage.getItem("token")
}