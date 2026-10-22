import {
  z,
  data,
  id,
  latitudeObrigatoria,
  longitudeObrigatoria,
  opcional,
  textoOpcional,
} from '../../core/validacao.js';

export const TIPOS_VISITA = ['evangelismo', 'acompanhamento', 'oracao', 'acao_social', 'outro'];
export const SITUACOES_VISITA = ['realizada', 'retornar', 'ausente'];

// "Hoje" no fuso do Maranhão: a visita registra algo que já aconteceu.
const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(new Date());

export const filtrosVisitas = z.object({
  de: opcional(data),
  ate: opcional(data),
  tipo: opcional(z.enum(TIPOS_VISITA, { error: 'Tipo de visita inválido.' })),
  situacao: opcional(z.enum(SITUACOES_VISITA, { error: 'Situação inválida.' })),
  igreja_id: opcional(id),
  criado_por: opcional(id),
});

export const esquemaVisita = z.object({
  tipo: z.enum(TIPOS_VISITA, { error: 'Escolha o tipo da visita.' }),
  situacao: z.enum(SITUACOES_VISITA, { error: 'Escolha como foi a visita.' }),
  data_visita: data.refine((valor) => valor <= hoje(), 'A data da visita não pode ser no futuro.'),
  latitude: latitudeObrigatoria,
  longitude: longitudeObrigatoria,
  pessoas_alcancadas: opcional(
    z.coerce
      .number({ error: 'Informe um número.' })
      .int('Informe um número inteiro.')
      .min(0, 'O número não pode ser negativo.')
      .max(9999, 'Use no máximo 9999.'),
  ),
  observacoes: textoOpcional(500),
  igreja_id: opcional(id),
});
