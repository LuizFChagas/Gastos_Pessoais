export const CATEGORIAS = [
  "salário",
  "alimentação",
  "supermercado",
  "transporte",
  "saúde",
  "beleza",
  "entretenimento",
  "lazer",
  "compras",
  "educação",
  "moradia",
  "financeiro",
  "viagem",
  "pet",
  "vestuário",
  "tecnologia",
  "serviços",
  "outros",
];

export const CATEGORIA_STYLE = {
  "salário":       { bg: "#d1fae5", color: "#065f46", icon: "💰" },
  "alimentação":   { bg: "#fef3c7", color: "#92400e", icon: "🍔" },
  "supermercado":  { bg: "#fef9c3", color: "#713f12", icon: "🛒" },
  "transporte":    { bg: "#dbeafe", color: "#1e40af", icon: "🚗" },
  "saúde":         { bg: "#fee2e2", color: "#991b1b", icon: "💊" },
  "beleza":        { bg: "#fce7f3", color: "#9d174d", icon: "💅" },
  "entretenimento":{ bg: "#ede9fe", color: "#5b21b6", icon: "🎬" },
  "lazer":         { bg: "#fdf2f8", color: "#86198f", icon: "🎮" },
  "compras":       { bg: "#ffedd5", color: "#9a3412", icon: "🛍️" },
  "educação":      { bg: "#e0e7ff", color: "#3730a3", icon: "📚" },
  "moradia":       { bg: "#f0fdf4", color: "#166534", icon: "🏠" },
  "financeiro":    { bg: "#f1f5f9", color: "#334155", icon: "🏦" },
  "viagem":        { bg: "#ccfbf1", color: "#134e4a", icon: "✈️" },
  "pet":           { bg: "#fef3c7", color: "#78350f", icon: "🐾" },
  "vestuário":     { bg: "#fce7f3", color: "#831843", icon: "👕" },
  "tecnologia":    { bg: "#e0f2fe", color: "#075985", icon: "💻" },
  "serviços":      { bg: "#f3f4f6", color: "#374151", icon: "🔧" },
  "outros":        { bg: "#e5e7eb", color: "#374151", icon: "🏷️" },
};

export const getCategoriaSyle = (categoria) => {
  const key = categoria?.toLowerCase();
  return CATEGORIA_STYLE[key] || CATEGORIA_STYLE["outros"];
};
