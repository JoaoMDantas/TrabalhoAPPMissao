import { sessao } from './sessao.js';

// O progresso na trilha de capacitação é pessoal e fica salvo apenas neste aparelho.
const chaveProgresso = () => `pm.capacitacao.${sessao.usuario.id}`;

/** Ids dos materiais que a pessoa marcou como concluídos. */
export function lerConcluidos() {
  try {
    return new Set(JSON.parse(localStorage.getItem(chaveProgresso())) ?? []);
  } catch {
    return new Set();
  }
}

export function salvarConcluidos(ids) {
  try {
    localStorage.setItem(chaveProgresso(), JSON.stringify([...ids]));
  } catch {
    // Sem armazenamento disponível: o progresso vale só enquanto a tela estiver aberta.
  }
}

const CHAVE_TRILHA = 'pm.capacitacao.trilha';

/** Guarda título e endereço dos materiais para o leitor abrir PDFs já baixados mesmo sem internet. */
export function guardarTrilha(materiais) {
  try {
    const resumo = materiais.map(({ id, titulo, tipo, url }) => ({ id, titulo, tipo, url }));
    localStorage.setItem(CHAVE_TRILHA, JSON.stringify(resumo));
  } catch {
    // Sem armazenamento disponível: o leitor só funciona com internet.
  }
}

export function materialGuardado(id) {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_TRILHA))?.find((material) => material.id === id) ?? null;
  } catch {
    return null;
  }
}

/** Marca ou desmarca um material como concluído e devolve o novo estado. */
export function alternarConcluido(id) {
  const ids = lerConcluidos();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  salvarConcluidos(ids);
  return ids.has(id);
}
