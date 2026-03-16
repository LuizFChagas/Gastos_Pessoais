const API_URL = "http://localhost:8000"

export function getAuthHeaders() {

  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("Usuário não autenticado")
  }

  return {
    "Authorization": `Bearer ${token}`
  }
}

export default API_URL