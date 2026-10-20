import { erros } from '../../core/erros.js';
import { podeGerenciar } from '../../core/permissoes.js';
import * as repositorio from './materiais.repository.js';

// Materiais da trilha inicial não têm autor (criado_por nulo): só o admin pode excluí-los.
const comPermissoes = (usuario, material) => ({
  ...material,
  pode_excluir: podeGerenciar(usuario, { autorId: material.criado_por }),
});

export async function listar(usuario) {
  const materiais = await repositorio.listar();
  return materiais.map((material) => comPermissoes(usuario, material));
}

export async function criar(usuario, dados) {
  const id = await repositorio.criar(dados, usuario.id);
  return comPermissoes(usuario, await repositorio.buscarPorId(id));
}

export async function excluir(usuario, id) {
  const material = await repositorio.buscarPorId(id);
  if (!material) throw erros.naoEncontrado('Material não encontrado.');
  if (!comPermissoes(usuario, material).pode_excluir) throw erros.semPermissao('Você não pode excluir este material.');
  await repositorio.excluir(id);
}
