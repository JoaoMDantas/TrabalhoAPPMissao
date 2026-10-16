import { erros } from '../erros.js';

/**
 * Valida params, query e body com esquemas Zod.
 * Os dados já convertidos e limpos ficam em req.valido.{params,query,body}.
 */
export const validar = (esquemas) => (req, res, next) => {
  req.valido = req.valido || {};

  for (const parte of ['params', 'query', 'body']) {
    const esquema = esquemas[parte];
    if (!esquema) continue;

    const resultado = esquema.safeParse(req[parte] ?? {});
    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensagem: issue.message,
      }));
      throw erros.requisicaoInvalida(detalhes[0]?.mensagem || 'Dados inválidos.', detalhes);
    }
    req.valido[parte] = resultado.data;
  }

  next();
};
