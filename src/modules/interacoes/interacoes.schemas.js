import { z, id } from '../../core/validacao.js';

export const LIMITE_COMENTARIO = 500;
// Uma conversa muito longa mostra só os comentários mais recentes.
export const MAXIMO_COMENTARIOS = 300;

export const paramsComentario = z.object({ id, comentarioId: id });

export const esquemaComentario = z.object({
  conteudo: z
    .string({ error: 'Escreva o comentário.' })
    .trim()
    .min(1, 'Escreva o comentário.')
    .max(LIMITE_COMENTARIO, `O comentário pode ter no máximo ${LIMITE_COMENTARIO} caracteres.`),
});
