import API_URL, { getAuthHeaders } from "./api"

export async function adicionarGasto(descricao, valor, categoria, data_hora = null) {

  const response = await fetch(`${API_URL}/gastos/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      descricao,
      valor,
      categoria,
      data_hora
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Erro ao adicionar gasto")
  }

  return data
}

export async function importarExtrato(arquivo) {

  const formData = new FormData()
  formData.append("file", arquivo)

  const response = await fetch(`${API_URL}/gastos/importar`, {
    method: "POST",
    headers: {
      ...getAuthHeaders()
    },
    body: formData
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || "Erro ao importar extrato")
  }

  return data
}