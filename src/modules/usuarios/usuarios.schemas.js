import { z, id, opcional, senhaNova, telefoneOpcional, textoOpcional } from '../../core/validacao.js';
import { PAPEIS } from '../../core/permissoes.js';

export const filtrosUsuarios = z.object({
  papel: opcional(z.enum(Object.values(PAPEIS), { error: 'Papel inválido.' })),
  igreja_id: opcional(id),
  busca: textoOpcional(100),
});

export const esquemaPerfil = z.object({
  nome: z
    .string({ error: 'Informe seu nome.' })
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(120, 'Use no máximo 120 caracteres.'),
  telefone: telefoneOpcional,
  igreja_id: opcional(id),
  bairro_atuacao: textoOpcional(80),
  sobre: textoOpcional(500),
});

export const esquemaTrocaSenha = z.object({
  senha_atual: z.string({ error: 'Informe a senha atual.' }).min(1, 'Informe a senha atual.'),
  nova_senha: senhaNova,
});
