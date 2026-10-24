import { erros } from '../../core/erros.js';
import { podeGerenciar } from '../../core/permissoes.js';
import { ALVOS } from './interacoes.alvos.js';
import { MAXIMO_COMENTARIOS } from './interacoes.schemas.js';
import * as repositorio from './interacoes.repository.js';

// "nomeAlvo" é "mural" (mensagens) ou "eventos" (agenda), as chaves de interacoes.alvos.js.

/** Acrescenta a cada item os totais de curtidas e comentários e se a pessoa já curtiu. */
export async function comInteracoes(nomeAlvo, usuario, itens) {
  const ids = itens.map((item) => item.id);
  const { curtidas, comentarios } = await repositorio.totais(ALVOS[nomeAlvo], ids, usuario.id);
  const curtidasPorItem = new Map(curtidas.map((linha) => [linha.id, linha]));
  const comentariosPorItem = new Map(comentarios.map((linha) => [linha.id, linha.total]));

  return itens.map((item) => ({
    ...item,
    total_curtidas: curtidasPorItem.get(item.id)?.total ?? 0,
    curtiu: Boolean(curtidasPorItem.get(item.id)?.curtiu),
    total_comentarios: comentariosPorItem.get(item.id) ?? 0,
  }));
}

async function buscarItem(alvo, id) {
  const item = await alvo.buscar(id);
  if (!item) throw erros.naoEncontrado(alvo.naoEncontrado);
  return item;
}

// Apagam um comentário: quem escreveu, o autor da mensagem ou do evento, a liderança da igreja vinculada e o admin.
const comPermissoes = (usuario, comentario, item) => ({
  ...comentario,
  pode_excluir: usuario.id === comentario.autor_id || podeGerenciar(usuario, item),
});

/** Curte (curtiu = true) ou desfaz a curtida; repetir o pedido não muda nada. */
export async function curtir(nomeAlvo, usuario, id, curtiu) {
  const alvo = ALVOS[nomeAlvo];
  await buscarItem(alvo, id);
  if (curtiu) await repositorio.curtir(alvo, id, usuario.id);
  else await repositorio.descurtir(alvo, id, usuario.id);
  return { total_curtidas: await repositorio.contarCurtidas(alvo, id), curtiu };
}

export async function listarCurtidas(nomeAlvo, id) {
  const alvo = ALVOS[nomeAlvo];
  await buscarItem(alvo, id);
  return repositorio.listarCurtidas(alvo, id);
}

export async function listarComentarios(nomeAlvo, usuario, id) {
  const alvo = ALVOS[nomeAlvo];
  const item = await buscarItem(alvo, id);
  const comentarios = await repositorio.listarComentarios(alvo, id, MAXIMO_COMENTARIOS);
  return comentarios.map((comentario) => comPermissoes(usuario, comentario, item));
}

export async function comentar(nomeAlvo, usuario, id, { conteudo }) {
  const alvo = ALVOS[nomeAlvo];
  const item = await buscarItem(alvo, id);
  const comentarioId = await repositorio.criarComentario(alvo, id, usuario.id, conteudo);
  return comPermissoes(usuario, await repositorio.buscarComentario(alvo, id, comentarioId), item);
}

export async function excluirComentario(nomeAlvo, usuario, id, comentarioId) {
  const alvo = ALVOS[nomeAlvo];
  const item = await buscarItem(alvo, id);
  const comentario = await repositorio.buscarComentario(alvo, id, comentarioId);
  if (!comentario) throw erros.naoEncontrado('Comentário não encontrado.');
  if (!comPermissoes(usuario, comentario, item).pode_excluir) {
    throw erros.semPermissao('Você não pode excluir este comentário.');
  }
  await repositorio.excluirComentario(alvo, comentarioId);
}
