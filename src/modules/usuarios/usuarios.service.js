import { erros } from '../../core/erros.js';
import { conferirSenha, gerarHashSenha } from '../../core/senha.js';
import { garantirExiste as garantirIgrejaExiste } from '../igrejas/igrejas.service.js';
import * as repositorio from './usuarios.repository.js';

export const listar = (filtros) => repositorio.listar(filtros);

export async function obter(id) {
  const usuario = await repositorio.buscarPorId(id);
  if (!usuario || !usuario.ativo) throw erros.naoEncontrado('Pessoa não encontrada.');
  return usuario;
}

export async function atualizarPerfil(usuario, dados) {
  if (dados.igreja_id) await garantirIgrejaExiste(dados.igreja_id);
  await repositorio.atualizarPerfil(usuario.id, dados);
  return repositorio.buscarPorId(usuario.id);
}

export async function trocarSenha(usuario, { senha_atual: senhaAtual, nova_senha: novaSenha }) {
  const { senha_hash: hashAtual } = await repositorio.buscarCredenciais({ id: usuario.id });
  if (!(await conferirSenha(senhaAtual, hashAtual))) throw erros.requisicaoInvalida('A senha atual está incorreta.');
  await repositorio.atualizarSenha(usuario.id, await gerarHashSenha(novaSenha));
}
