import {
  Wallet, Utensils, Car, HeartPulse, Sparkles, Gamepad2,
  ShoppingBag, Bell, BookOpen, Home, Landmark, Plane,
  PawPrint, Wrench, Tag,
} from "lucide-react";

export const CATEGORIAS = [
  "salário",
  "alimentação",
  "transporte",
  "saúde",
  "beleza",
  "lazer",
  "compras",
  "assinaturas",
  "educação",
  "moradia",
  "financeiro",
  "viagem",
  "pet",
  "serviços",
  "outros",
];

export const CATEGORIA_STYLE = {
  "salário":     { bg: "#d1fae5", color: "#059669", chartColor: "#10b981", Icon: Wallet      },
  "alimentação": { bg: "#ffedd5", color: "#ea580c", chartColor: "#f97316", Icon: Utensils    },
  "transporte":  { bg: "#dbeafe", color: "#2563eb", chartColor: "#3b82f6", Icon: Car         },
  "saúde":       { bg: "#dcfce7", color: "#16a34a", chartColor: "#22c55e", Icon: HeartPulse  },
  "beleza":      { bg: "#fce7f3", color: "#db2777", chartColor: "#ec4899", Icon: Sparkles    },
  "lazer":       { bg: "#ede9fe", color: "#7c3aed", chartColor: "#8b5cf6", Icon: Gamepad2    },
  "compras":     { bg: "#fee2e2", color: "#dc2626", chartColor: "#ef4444", Icon: ShoppingBag },
  "assinaturas": { bg: "#e0f2fe", color: "#0284c7", chartColor: "#0ea5e9", Icon: Bell        },
  "educação":    { bg: "#e0e7ff", color: "#4338ca", chartColor: "#6366f1", Icon: BookOpen    },
  "moradia":     { bg: "#ccfbf1", color: "#0f766e", chartColor: "#14b8a6", Icon: Home        },
  "financeiro":  { bg: "#eff6ff", color: "#1d4ed8", chartColor: "#1e40af", Icon: Landmark    },
  "viagem":      { bg: "#cffafe", color: "#0891b2", chartColor: "#06b6d4", Icon: Plane       },
  "pet":         { bg: "#fef3c7", color: "#92400e", chartColor: "#b45309", Icon: PawPrint    },
  "serviços":    { bg: "#f5f5f4", color: "#57534e", chartColor: "#78716c", Icon: Wrench      },
  "outros":      { bg: "#fef9c3", color: "#d97706", chartColor: "#f59e0b", Icon: Tag         },
};

export const getCategoriaStyle = (categoria) => {
  const key = categoria?.toLowerCase();
  return CATEGORIA_STYLE[key] || CATEGORIA_STYLE["outros"];
};

export const capitalizar = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

// alias mantido para compatibilidade
export const getCategoriaSyle = getCategoriaStyle;
