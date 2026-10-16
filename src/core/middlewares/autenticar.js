import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { erros } from '../erros.js';
import * as usuariosRepositorio from '../../modules/usuarios/usuarios.repository.js';

/** Exige um token JWT válido e coloca o usuário logado em req.usuario. */
export async function autenticar(req, res, next) {
  const [tipo, token] = (req.get('authorization') || '').split(' ');
  if (tipo !== 'Bearer' || !token) throw erros.naoAutenticado();

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.segredo);
  } catch {
    throw erros.naoAutenticado('Sua sessão expirou. Entre novamente.');
  }

  // Busca no banco a cada requisição para refletir mudanças de papel ou desativação da conta.
  const usuario = await usuariosRepositorio.buscarPorId(Number(payload.sub));
  if (!usuario || !usuario.ativo) throw erros.naoAutenticado('Conta não encontrada ou desativada.');

  req.usuario = usuario;
  next();
}
