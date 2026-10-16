import { erros } from '../../core/erros.js';
import { podeGerenciar } from '../../core/permissoes.js';
import { garantirExiste as garantirIgrejaExiste } from '../igrejas/igrejas.service.js';
import * as repositorio from './eventos.repository.js';

const comPermissoes = (usuario, evento) => ({
  ...evento,
  pode_editar: podeGerenciar(usuario, { autorId: evento.criado_por, igrejaId: evento.igreja_id }),
});

async function buscarOuFalhar(id) {
  const evento = await repositorio.buscarPorId(id);
  if (!evento) throw erros.naoEncontrado('Evento não encontrado.');
  return evento;
}

async function garantirPodeEditar(usuario, id) {
  const evento = await buscarOuFalhar(id);
  if (!comPermissoes(usuario, evento).pode_editar) throw erros.semPermissao('Você não pode alterar este evento.');
}

export async function listar(usuario, filtros) {
  const eventos = await repositorio.listar(filtros);
  return eventos.map((evento) => comPermissoes(usuario, evento));
}

export async function obter(usuario, id) {
  return comPermissoes(usuario, await buscarOuFalhar(id));
}

export async function criar(usuario, dados) {
  if (dados.igreja_id) await garantirIgrejaExiste(dados.igreja_id);
  const id = await repositorio.criar(dados, usuario.id);
  return obter(usuario, id);
}

export async function atualizar(usuario, id, dados) {
  await garantirPodeEditar(usuario, id);
  if (dados.igreja_id) await garantirIgrejaExiste(dados.igreja_id);
  await repositorio.atualizar(id, dados);
  return obter(usuario, id);
}

export async function excluir(usuario, id) {
  await garantirPodeEditar(usuario, id);
  await repositorio.excluir(id);
}
