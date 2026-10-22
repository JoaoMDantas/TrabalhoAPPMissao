import { z } from '../../core/validacao.js';

export const filtrosBusca = z.object({
  q: z
    .string({ error: 'Digite o endereço que deseja procurar.' })
    .trim()
    .min(3, 'Digite pelo menos 3 letras do endereço.')
    .max(150, 'Use no máximo 150 caracteres.'),
});
