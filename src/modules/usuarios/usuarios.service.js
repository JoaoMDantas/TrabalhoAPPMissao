import { randomInt } from 'node:crypto';
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

// Sem caracteres parecidos (0/O, 1/l/I): a senha costuma ser repassada pelo WhatsApp e digitada no celular.
const ALFABETO_SENHA = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

const gerarSenhaTemporaria = (tamanho = 10) =>
  Array.from({ length: tamanho }, () => ALFABETO_SENHA[randomInt(ALFABETO_SENHA.length)]).join('');

/** Usado pelo administrador quando alguém esquece a senha; a pessoa troca depois em "Meu perfil". */
export async function redefinirSenha(id) {
  await obter(id);
  const senhaTemporaria = gerarSenhaTemporaria();
  await repositorio.atualizarSenha(id, await gerarHashSenha(senhaTemporaria));
  return { senha_temporaria: senhaTemporaria };
}

export async function trocarSenha(usuario, { senha_atual: senhaAtual, nova_senha: novaSenha }) {
  const { senha_hash: hashAtual } = await repositorio.buscarCredenciais({ id: usuario.id });
  if (!(await conferirSenha(senhaAtual, hashAtual))) throw erros.requisicaoInvalida('A senha atual está incorreta.');
  await repositorio.atualizarSenha(usuario.id, await gerarHashSenha(novaSenha));
}
