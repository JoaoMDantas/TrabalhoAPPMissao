import { z, emailOpcional, telefoneOpcional, textoOpcional } from '../../core/validacao.js';

export const filtrosIgrejas = z.object({
  busca: textoOpcional(100),
});

export const esquemaIgreja = z.object({
  nome: z
    .string({ error: 'Informe o nome da igreja.' })
    .trim()
    .min(3, 'Informe o nome da igreja (mínimo 3 caracteres).')
    .max(120, 'Use no máximo 120 caracteres.'),
  cidade: z.string({ error: 'Informe a cidade.' }).trim().min(2, 'Informe a cidade.').max(80, 'Use no máximo 80 caracteres.'),
  bairro: z.string({ error: 'Informe o bairro.' }).trim().min(2, 'Informe o bairro.').max(80, 'Use no máximo 80 caracteres.'),
  endereco: textoOpcional(200),
  telefone: telefoneOpcional,
  email: emailOpcional,
});
