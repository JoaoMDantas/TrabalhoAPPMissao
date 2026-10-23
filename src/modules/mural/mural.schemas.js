import { z, id, opcional } from '../../core/validacao.js';

export const TIPOS_MENSAGEM = ['mensagem', 'aviso'];
export const MAXIMO_FOTOS = 4;
export const LIMITE_FOTO_MB = 5;

export const filtrosMural = z.object({
  tipo: opcional(z.enum(TIPOS_MENSAGEM, { error: 'Tipo inválido.' })),
  igreja_id: opcional(id),
  antes_de: opcional(id),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

// O texto pode ficar vazio quando a mensagem tem fotos (o serviço confere).
export const esquemaMensagem = z.object({
  conteudo: opcional(z.string().trim().max(1000, 'A mensagem pode ter no máximo 1000 caracteres.')),
  tipo: z.enum(TIPOS_MENSAGEM, { error: 'Tipo inválido.' }).default('mensagem'),
  igreja_id: opcional(id),
});

export const linkDaFoto = z.object({
  expira: z.coerce.number().int().positive(),
  assinatura: z.string().min(10).max(100),
});
