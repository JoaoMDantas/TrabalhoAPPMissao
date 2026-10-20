import { z, textoOpcional } from '../../core/validacao.js';

export const TIPOS_MATERIAL = ['pdf', 'video', 'link'];

// Só links web ou PDFs hospedados no próprio app; impede endereços como "javascript:" (XSS).
const LINK_PERMITIDO = /^(https?:\/\/\S+|\/materiais\/[\w.-]+)$/i;

export const esquemaMaterial = z.object({
  titulo: z
    .string({ error: 'Informe o título.' })
    .trim()
    .min(3, 'Informe o título (mínimo 3 caracteres).')
    .max(150, 'Use no máximo 150 caracteres.'),
  descricao: textoOpcional(500),
  tipo: z.enum(TIPOS_MATERIAL, { error: 'Escolha o tipo do material.' }),
  url: z
    .string({ error: 'Informe o link do material.' })
    .trim()
    .max(500, 'Use no máximo 500 caracteres.')
    .regex(LINK_PERMITIDO, 'Informe um link completo, começando com https://'),
  etapa: z
    .string({ error: 'Informe a etapa da trilha.' })
    .trim()
    .min(2, 'Informe a etapa da trilha.')
    .max(80, 'Use no máximo 80 caracteres.'),
  ordem: z.coerce.number().int().min(0).max(999).default(99),
});
