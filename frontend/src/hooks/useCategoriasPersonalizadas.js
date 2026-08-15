import { useCallback, useEffect, useState } from "react";
import {
  listarCategoriasPersonalizadas,
  criarCategoriaPersonalizada,
  deletarCategoriaPersonalizada,
} from "../api/categoriasApi";

export const LIMITE_CATEGORIAS_PERSONALIZADAS = 3;

export function useCategoriasPersonalizadas() {
  const [categoriasPersonalizadas, setCategoriasPersonalizadas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const data = await listarCategoriasPersonalizadas();
      setCategoriasPersonalizadas(data);
    } catch {
      // silencioso — a tela funciona normalmente só com as categorias fixas
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const criar = async (nome, cor) => {
    const nova = await criarCategoriaPersonalizada(nome, cor);
    await carregar();
    return nova;
  };

  const remover = async (id) => {
    await deletarCategoriaPersonalizada(id);
    await carregar();
  };

  return { categoriasPersonalizadas, carregando, criar, remover, recarregar: carregar };
}
