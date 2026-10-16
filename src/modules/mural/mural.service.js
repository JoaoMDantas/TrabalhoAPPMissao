import { erros } from '../../core/erros.js';
import { PAPEIS, podeGerenciar } from '../../core/permissoes.js';
import { garantirExiste as garantirIgrejaExiste } from '../igrejas/igrejas.service.js';
import * as repositorio from './mural.repository.js';

const comPermissoes = (usuario, mensagem) => ({
  ...mensagem,
  pode_excluir: podeGerenciar(usuario, { autorId: mensagem.autor_id, igrejaId: mensagem.igreja_id }),
});

export async function listar(usuario, filtros) {
  const mensagens = await repositorio.listar(filtros);
  return mensagens.map((mensagem) => comPermissoes(usuario, mensagem));
}

export async function criar(usuario, dados) {
  if (dados.tipo === 'aviso' && usuario.papel === PAPEIS.MISSIONARIO) {
    throw erros.semPermissao('Apenas líderes e administradores podem publicar avisos.');
  }
  if (dados.igreja_id) await garantirIgrejaExiste(dados.igreja_id);

  const id = await repositorio.criar(dados, usuario.id);
  return comPermissoes(usuario, await repositorio.buscarPorId(id));
}

export async function excluir(usuario, id) {
  const mensagem = await repositorio.buscarPorId(id);
  if (!mensagem) throw erros.naoEncontrado('Mensagem não encontrada.');
  if (!comPermissoes(usuario, mensagem).pode_excluir) throw erros.semPermissao('Você não pode excluir esta mensagem.');
  await repositorio.excluir(id);
}
