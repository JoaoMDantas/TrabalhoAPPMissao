import { z, dataHora, dataOuDataHora, id, opcional, textoOpcional } from '../../core/validacao.js';

export const TIPOS_EVENTO = ['culto', 'visita', 'acao_social', 'reuniao', 'outro'];

export const filtrosEventos = z.object({
  de: opcional(dataOuDataHora),
  ate: opcional(dataOuDataHora),
  tipo: opcional(z.enum(TIPOS_EVENTO, { error: 'Tipo de evento inválido.' })),
  igreja_id: opcional(id),
  criado_por: opcional(id),
  limite: z.coerce.number().int().min(1).max(200).default(100),
});

export const esquemaEvento = z
  .object({
    titulo: z
      .string({ error: 'Informe o título.' })
      .trim()
      .min(3, 'Informe o título (mínimo 3 caracteres).')
      .max(120, 'Use no máximo 120 caracteres.'),
    descricao: textoOpcional(2000),
    tipo: z.enum(TIPOS_EVENTO, { error: 'Escolha o tipo do evento.' }),
    data_inicio: dataHora,
    data_fim: opcional(dataHora),
    local: textoOpcional(200),
    igreja_id: opcional(id),
  })
  .refine((evento) => !evento.data_fim || evento.data_fim >= evento.data_inicio, {
    error: 'O término precisa ser depois do início.',
    path: ['data_fim'],
  });
