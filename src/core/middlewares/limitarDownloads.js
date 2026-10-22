import rateLimit from 'express-rate-limit';
import { config } from '../../config/env.js';

/** Limita downloads por IP: o servidor busca os arquivos em outros sites e não deve virar um "repetidor". */
export const limitarDownloads = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.ehTeste,
  message: { erro: { mensagem: 'Muitos downloads em pouco tempo. Aguarde alguns minutos e tente novamente.' } },
});
