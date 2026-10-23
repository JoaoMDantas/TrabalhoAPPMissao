import { z, id, opcional, textoOpcional } from '../../core/validacao.js';

export const LIMITE_DOCUMENTO_MB = 10;

// "igreja_id" só é usado pelo admin; as demais pessoas veem e enviam documentos da própria igreja.
export const filtrosDocumentos = z.object({
  igreja_id: opcional(id),
});

export const esquemaDocumento = z.object({
  titulo: z
    .string({ error: 'Informe o título do documento.' })
    .trim()
    .min(3, 'Informe o título (mínimo 3 caracteres).')
    .max(150, 'Use no máximo 150 caracteres.'),
  descricao: textoOpcional(500),
  igreja_id: opcional(id),
});
