import { z, emailObrigatorio, id, opcional, senhaNova, telefoneOpcional, textoOpcional } from '../../core/validacao.js';
import { PAPEIS } from '../../core/permissoes.js';
import { esquemaPerfil } from '../usuarios/usuarios.schemas.js';

export const esquemaRegistro = z.object({
  nome: esquemaPerfil.shape.nome,
  email: emailObrigatorio,
  senha: senhaNova,
  telefone: telefoneOpcional,
  // Admin nunca é escolhido no cadastro; ele é criado pelo seed.
  papel: z
    .enum([PAPEIS.MISSIONARIO, PAPEIS.LIDER], { error: 'Escolha se você é missionário ou líder de igreja.' })
    .default(PAPEIS.MISSIONARIO),
  igreja_id: opcional(id),
  bairro_atuacao: textoOpcional(80),
  // Checkbox do formulário: chega como "on" quando marcada.
  aceite: z.preprocess(
    (valor) => valor === true || valor === 'on' || valor === 'true',
    z.literal(true, { error: 'Para criar a conta, é preciso aceitar o aviso de privacidade.' }),
  ),
});

export const esquemaLogin = z.object({
  email: emailObrigatorio,
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
});
