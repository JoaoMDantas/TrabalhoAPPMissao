import { erros } from '../../core/erros.js';
import { PAPEIS, ehAdmin, podeGerenciar } from '../../core/permissoes.js';
import * as usuariosRepositorio from '../usuarios/usuarios.repository.js';
import * as repositorio from './igrejas.repository.js';

const podeExcluir = (usuario, igreja) => ehAdmin(usuario) || igreja.criado_por === usuario.id;

const comPermissoes = (usuario, igreja) => ({
  ...igreja,
  pode_editar: podeGerenciar(usuario, { autorId: igreja.criado_por, igrejaId: igreja.id }),
  pode_excluir: podeExcluir(usuario, igreja),
});

async function buscarOuFalhar(id) {
  const igreja = await repositorio.buscarPorId(id);
  if (!igreja) throw erros.naoEncontrado('Igreja não encontrada.');
  return igreja;
}

/** Usado por outros módulos antes de vincular algo a uma igreja. */
export async function garantirExiste(id) {
  if (!(await repositorio.existe(id))) throw erros.requisicaoInvalida('A igreja selecionada não existe.');
}

export const listar = (filtros) => repositorio.listar(filtros);

export const listarOpcoes = () => repositorio.listarOpcoes();

export async function obter(usuario, id) {
  return comPermissoes(usuario, await buscarOuFalhar(id));
}

export async function criar(usuario, dados) {
  const id = await repositorio.criar(dados, usuario.id);

  // O líder que ainda não tem igreja passa a fazer parte da que acabou de cadastrar.
  if (usuario.papel === PAPEIS.LIDER && !usuario.igreja_id) {
    await usuariosRepositorio.definirIgreja(usuario.id, id);
  }

  return obter(usuario, id);
}

export async function atualizar(usuario, id, dados) {
  const igreja = await buscarOuFalhar(id);
  if (!comPermissoes(usuario, igreja).pode_editar) throw erros.semPermissao('Você não pode editar esta igreja.');
  await repositorio.atualizar(id, dados);
  return obter(usuario, id);
}

export async function excluir(usuario, id) {
  const igreja = await buscarOuFalhar(id);
  if (!podeExcluir(usuario, igreja)) throw erros.semPermissao('Você não pode excluir esta igreja.');
  await repositorio.excluir(id);
}
