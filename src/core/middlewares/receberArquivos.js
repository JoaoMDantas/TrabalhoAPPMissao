import multer from 'multer';
import { erros } from '../erros.js';

/**
 * Recebe arquivos de um formulário (multipart/form-data) na memória, com limite de tamanho e de quantidade.
 * Os arquivos ficam em req.files e os demais campos em req.body. Requisições sem arquivo (JSON) passam direto.
 */
export function receberArquivos(campo, { limiteMb, maximo = 1 }) {
  const receber = multer({
    storage: multer.memoryStorage(),
    // Nomes como "Calendário.pdf" chegam em UTF-8.
    defParamCharset: 'utf8',
    limits: { fileSize: limiteMb * 1024 * 1024, files: maximo, fields: 20 },
  }).array(campo, maximo);

  return (req, res, next) =>
    receber(req, res, (erro) => {
      if (!erro) return next();
      if (erro.code === 'LIMIT_FILE_SIZE') return next(erros.arquivoGrande(`Cada arquivo pode ter no máximo ${limiteMb} MB.`));
      if (erro.code === 'LIMIT_FILE_COUNT' || erro.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(erros.requisicaoInvalida(maximo === 1 ? 'Envie um arquivo por vez.' : `Envie no máximo ${maximo} arquivos.`));
      }
      return next(erro);
    });
}
