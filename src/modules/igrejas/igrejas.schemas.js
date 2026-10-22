import {
  z,
  coordenadasCompletas,
  emailOpcional,
  latitude,
  longitude,
  telefoneOpcional,
  textoOpcional,
} from '../../core/validacao.js';

export const filtrosIgrejas = z.object({
  busca: textoOpcional(100),
});

export const esquemaIgreja = z
  .object({
    nome: z
      .string({ error: 'Informe o nome da igreja.' })
      .trim()
      .min(3, 'Informe o nome da igreja (mínimo 3 caracteres).')
      .max(120, 'Use no máximo 120 caracteres.'),
    cidade: z.string({ error: 'Informe a cidade.' }).trim().min(2, 'Informe a cidade.').max(80, 'Use no máximo 80 caracteres.'),
    bairro: z.string({ error: 'Informe o bairro.' }).trim().min(2, 'Informe o bairro.').max(80, 'Use no máximo 80 caracteres.'),
    endereco: textoOpcional(200),
    latitude,
    longitude,
    telefone: telefoneOpcional,
    email: emailOpcional,
  })
  .refine(...coordenadasCompletas);

/** Só a localização no mapa (as duas vazias removem a marcação). */
export const esquemaLocalizacaoIgreja = z.object({ latitude, longitude }).refine(...coordenadasCompletas);
