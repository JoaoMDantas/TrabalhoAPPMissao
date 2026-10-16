import { erros } from '../erros.js';

/** Permite a rota apenas para os papéis informados. Use depois de autenticar. */
export const autorizar =
  (...papeis) =>
  (req, res, next) => {
    if (!req.usuario) throw erros.naoAutenticado();
    if (!papeis.includes(req.usuario.papel)) throw erros.semPermissao();
    next();
  };
