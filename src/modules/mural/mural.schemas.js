import { z, id, opcional } from '../../core/validacao.js';

export const TIPOS_MENSAGEM = ['mensagem', 'aviso'];

export const filtrosMural = z.object({
  tipo: opcional(z.enum(TIPOS_MENSAGEM, { error: 'Tipo inválido.' })),
  igreja_id: opcional(id),
  antes_de: opcional(id),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

export const esquemaMensagem = z.object({
  conteudo: z
    .string({ error: 'Escreva a mensagem.' })
    .trim()
    .min(1, 'Escreva a mensagem.')
    .max(1000, 'A mensagem pode ter no máximo 1000 caracteres.'),
  tipo: z.enum(TIPOS_MENSAGEM, { error: 'Tipo inválido.' }).default('mensagem'),
  igreja_id: opcional(id),
});
