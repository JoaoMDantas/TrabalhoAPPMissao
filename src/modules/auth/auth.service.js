import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { erros } from '../../core/erros.js';
import { conferirSenha, gerarHashSenha } from '../../core/senha.js';
import { garantirExiste as garantirIgrejaExiste } from '../igrejas/igrejas.service.js';
import * as usuariosRepositorio from '../usuarios/usuarios.repository.js';

let hashFicticio;
const obterHashFicticio = async () => (hashFicticio ??= await gerarHashSenha('senha-ficticia-para-tempo-constante'));

function gerarToken(usuario) {
  return jwt.sign({ papel: usuario.papel }, config.jwt.segredo, {
    subject: String(usuario.id),
    expiresIn: config.jwt.expiracao,
  });
}

const criarSessao = (usuario) => ({ token: gerarToken(usuario), usuario });

export async function registrar(dados) {
  if (await usuariosRepositorio.emailEmUso(dados.email)) throw erros.conflito('Este e-mail já está cadastrado.');
  if (dados.igreja_id) await garantirIgrejaExiste(dados.igreja_id);

  const id = await usuariosRepositorio.criar({ ...dados, senha_hash: await gerarHashSenha(dados.senha) });
  return criarSessao(await usuariosRepositorio.buscarPorId(id));
}

export async function entrar({ email, senha }) {
  const credenciais = await usuariosRepositorio.buscarCredenciais({ email });

  // Compara mesmo quando o e-mail não existe, para que o tempo de resposta não revele quais e-mails estão cadastrados.
  const senhaConfere = await conferirSenha(senha, credenciais?.senha_hash ?? (await obterHashFicticio()));
  if (!credenciais || !senhaConfere) throw erros.naoAutenticado('E-mail ou senha incorretos.');
  if (!credenciais.ativo) throw erros.semPermissao('Esta conta está desativada.');

  return criarSessao(await usuariosRepositorio.buscarPorId(credenciais.id));
}
