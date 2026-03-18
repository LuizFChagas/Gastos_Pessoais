import unicodedata

MAPEAMENTO = {
    # TRANSPORTE
    "uber": "Transporte",
    "99": "Transporte",
    "taxi": "Transporte",
    "cabify": "Transporte",
    "posto": "Transporte",
    "gasolina": "Transporte",
    "etanol": "Transporte",
    "combustivel": "Transporte",
    "estacionamento": "Transporte",
    "pedagio": "Transporte",

    # ALIMENTAÇÃO
    "ifood": "Alimentação",
    "restaurante": "Alimentação",
    "lanchonete": "Alimentação",
    "padaria": "Alimentação",
    "cafe": "Alimentação",
    "cafeteria": "Alimentação",
    "mc donalds": "Alimentação",
    "mcdonalds": "Alimentação",
    "burger king": "Alimentação",
    "bk": "Alimentação",
    "pizza": "Alimentação",
    "pizzaria": "Alimentação",
    "hamburguer": "Alimentação",
    "lanche": "Alimentação",

    # SUPERMERCADO
    "mercado": "Supermercado",
    "supermercado": "Supermercado",
    "extra": "Supermercado",
    "carrefour": "Supermercado",
    "assai": "Supermercado",
    "atacadao": "Supermercado",
    "pao de acucar": "Supermercado",

    # SAÚDE
    "farmacia": "Saúde",
    "drogaria": "Saúde",
    "droga raia": "Saúde",
    "drogasil": "Saúde",
    "hospital": "Saúde",
    "clinica": "Saúde",
    "medico": "Saúde",
    "consulta": "Saúde",
    "exame": "Saúde",

    # ENTRETENIMENTO
    "netflix": "Entretenimento",
    "spotify": "Entretenimento",
    "amazon prime": "Entretenimento",
    "disney": "Entretenimento",
    "hbo": "Entretenimento",
    "cinema": "Entretenimento",
    "ingresso": "Entretenimento",
    "show": "Entretenimento",
    "teatro": "Entretenimento",

    # COMPRAS
    "amazon": "Compras",
    "mercado livre": "Compras",
    "shopee": "Compras",
    "aliexpress": "Compras",
    "magalu": "Compras",
    "americanas": "Compras",
    "loja": "Compras",
    "shopping": "Compras",

    # EDUCAÇÃO
    "curso": "Educação",
    "udemy": "Educação",
    "alura": "Educação",
    "faculdade": "Educação",
    "escola": "Educação",
    "livro": "Educação",

    # MORADIA
    "aluguel": "Moradia",
    "condominio": "Moradia",
    "energia": "Moradia",
    "luz": "Moradia",
    "agua": "Moradia",
    "sabesp": "Moradia",
    "enel": "Moradia",
    "internet": "Moradia",
    "vivo": "Moradia",
    "claro": "Moradia",
    "tim": "Moradia",

    # FINANCEIRO
    "banco": "Financeiro",
    "nubank": "Financeiro",
    "itau": "Financeiro",
    "bradesco": "Financeiro",
    "santander": "Financeiro",
    "taxa": "Financeiro",
    "juros": "Financeiro",
    "tarifa": "Financeiro",

    # VIAGEM
    "hotel": "Viagem",
    "passagem": "Viagem",
    "airbnb": "Viagem",
    "booking": "Viagem",
    "decolar": "Viagem",

    # PET
    "petshop": "Pet",
    "racao": "Pet",
    "veterinario": "Pet",

    # VESTUÁRIO
    "roupa": "Vestuário",
    "zara": "Vestuário",
    "renner": "Vestuário",
    "c&a": "Vestuário",
    "nike": "Vestuário",
    "adidas": "Vestuário",
    "calcado": "Vestuário",

    # TECNOLOGIA
    "apple": "Tecnologia",
    "google": "Tecnologia",
    "microsoft": "Tecnologia",
    "software": "Tecnologia",
    "hardware": "Tecnologia",
    "notebook": "Tecnologia",
    "celular": "Tecnologia",

    # SERVIÇOS
    "servico": "Serviços",
    "manutencao": "Serviços",
    "conserto": "Serviços",
    "eletricista": "Serviços",
    "encanador": "Serviços",
    "limpeza": "Serviços"
}


def normalizar(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ASCII", "ignore").decode("ASCII").lower()


def categorizar(descricao: str) -> str:
    descricao = normalizar(descricao)

    # Ordena pelas chaves maiores primeiro (mais específicas)
    for chave in sorted(MAPEAMENTO.keys(), key=len, reverse=True):
        if chave in descricao:
            return MAPEAMENTO[chave]

    return "Outros"