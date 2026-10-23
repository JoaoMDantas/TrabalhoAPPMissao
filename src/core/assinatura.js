import crypto from 'node:crypto';
import { config } from '../config/env.js';

/*
 * Links assinados para arquivos que abrem em <img> (que não envia o login no cabeçalho), como as fotos do mural.
 * Só o servidor sabe gerar a assinatura; o link vence e não serve para outro arquivo.
 */

// Chave própria para os links, derivada do segredo do login (assim não há outra variável para configurar).
const CHAVE = crypto.createHash('sha256').update(`links-de-arquivos:${config.jwt.segredo}`).digest();
const DIA = 24 * 60 * 60;

const calcular = (recurso, expira) => crypto.createHmac('sha256', CHAVE).update(`${recurso}:${expira}`).digest('base64url');

/**
 * Assina um recurso (ex.: "foto-mural:12"). O link vale até a meia-noite (UTC) de depois de amanhã:
 * assim ele se repete ao longo do dia e o navegador aproveita o que já baixou.
 */
export function assinar(recurso) {
  const expira = (Math.floor(Date.now() / 1000 / DIA) + 2) * DIA;
  return { expira, assinatura: calcular(recurso, expira) };
}

export function assinaturaValida(recurso, expira, assinatura) {
  if (!Number.isInteger(expira) || expira * 1000 < Date.now()) return false;
  const esperada = Buffer.from(calcular(recurso, expira));
  const recebida = Buffer.from(String(assinatura));
  return esperada.length === recebida.length && crypto.timingSafeEqual(esperada, recebida);
}
