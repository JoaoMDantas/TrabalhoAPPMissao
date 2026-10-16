import { AppError } from '../erros.js';

const ERROS_MYSQL = {
  ER_DUP_ENTRY: [409, 'Este registro já existe.'],
  ER_NO_REFERENCED_ROW_2: [400, 'O registro relacionado não existe.'],
  ER_ROW_IS_REFERENCED_2: [409, 'Não é possível excluir: existem registros vinculados.'],
  ER_DATA_TOO_LONG: [400, 'Um dos campos ultrapassa o tamanho permitido.'],
};

const BANCO_INDISPONIVEL = new Set(['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'PROTOCOL_CONNECTION_LOST']);

function responder(res, status, mensagem, detalhes) {
  res.status(status).json({ erro: detalhes ? { mensagem, detalhes } : { mensagem } });
}

export function rotaNaoEncontrada(req, res) {
  responder(res, 404, 'Rota não encontrada.');
}

// O Express só reconhece um tratador de erros quando a função declara os 4 parâmetros.
export function tratarErros(erro, req, res, next) {
  if (res.headersSent) return next(erro);

  if (erro instanceof AppError) return responder(res, erro.status, erro.message, erro.detalhes);
  if (erro.type === 'entity.parse.failed') return responder(res, 400, 'O corpo da requisição não é um JSON válido.');
  if (erro.type === 'entity.too.large') return responder(res, 413, 'Os dados enviados são grandes demais.');
  if (ERROS_MYSQL[erro.code]) return responder(res, ...ERROS_MYSQL[erro.code]);

  if (BANCO_INDISPONIVEL.has(erro.code)) {
    console.error(`[banco] ${erro.code}: ${erro.message}`);
    return responder(res, 503, 'Banco de dados indisponível. Tente novamente em instantes.');
  }

  console.error(erro);
  return responder(res, 500, 'Erro interno do servidor.');
}
