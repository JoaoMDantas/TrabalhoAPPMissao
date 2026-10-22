import { erros } from '../../core/erros.js';
import { podeGerenciar } from '../../core/permissoes.js';
import { garantirExiste as garantirIgrejaExiste } from '../igrejas/igrejas.service.js';
import * as repositorio from './visitas.repository.js';

// Quem registrou, a liderança da igreja vinculada ou o admin podem alterar a visita.
const comPermissoes = (usuario, visita) => ({
  ...visita,
  pode_editar: podeGerenciar(usuario, { autorId: visita.criado_por, igrejaId: visita.igreja_id }),
});

async function buscarOuFalhar(id) {
  const visita = await repositorio.buscarPorId(id);
  if (!visita) throw erros.naoEncontrado('Visita não encontrada.');
  return visita;
}

async function garantirPodeEditar(usuario, id) {
  const visita = await buscarOuFalhar(id);
  if (!comPermissoes(usuario, visita).pode_editar) throw erros.semPermissao('Você não pode alterar esta visita.');
}

export async function listar(usuario, filtros) {
  const visitas = await repositorio.listar(filtros);
  return visitas.map((visita) => comPermissoes(usuario, visita));
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
