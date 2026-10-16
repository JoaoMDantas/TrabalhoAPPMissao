import rateLimit from 'express-rate-limit';
import { config } from '../../config/env.js';

/** Limita tentativas falhas de login/cadastro por IP para dificultar ataques de força bruta. */
export const limitarTentativas = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.ehTeste,
  message: { erro: { mensagem: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' } },
});
