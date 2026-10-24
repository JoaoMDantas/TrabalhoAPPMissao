import { erros } from '../../core/erros.js';
import { buscarPorId as buscarEvento } from '../eventos/eventos.repository.js';
import * as repositorio from './presencas.repository.js';

/** Acrescenta a cada evento o total de presenças confirmadas e se a pessoa confirmou. */
export async function comPresencas(usuario, eventos) {
  const ids = eventos.map((evento) => evento.id);
  const porEvento = new Map((await repositorio.totais(ids, usuario.id)).map((linha) => [linha.id, linha]));

  return eventos.map((evento) => ({
    ...evento,
    total_presencas: porEvento.get(evento.id)?.total ?? 0,
    confirmou: Boolean(porEvento.get(evento.id)?.confirmou),
  }));
}

async function buscarOuFalhar(id) {
  const evento = await buscarEvento(id);
  if (!evento) throw erros.naoEncontrado('Evento não encontrado.');
  return evento;
}

/**
 * Confirma (confirmou = true) ou cancela a presença; repetir o pedido não muda nada.
 * Depois que o evento termina, a lista fica fechada: ela passa a ser o registro de quem confirmou.
 */
export async function marcar(usuario, id, confirmou) {
  const evento = await buscarOuFalhar(id);
  if (evento.encerrado) {
    throw erros.conflito('Este evento já terminou. A lista de presença não pode mais ser alterada.');
  }

  if (confirmou) await repositorio.confirmar(id, usuario.id);
  else await repositorio.cancelar(id, usuario.id);
  return { total_presencas: await repositorio.contar(id), confirmou };
}

export async function listar(id) {
  await buscarOuFalhar(id);
  return repositorio.listar(id);
}
