import path from 'node:path';

/*
 * Tipos de arquivo aceitos em uploads. O tipo é conferido pelo conteúdo (os primeiros bytes), e não só pelo
 * nome: um arquivo HTML renomeado para ".pdf" é recusado. "inline" diz se o navegador pode exibir o arquivo;
 * os demais são sempre baixados.
 */
const OFFICE_ZIP = {
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', grupo: 'documento' },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', grupo: 'planilha' },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', grupo: 'apresentacao' },
};
const OFFICE_ANTIGO = {
  doc: { mime: 'application/msword', grupo: 'documento' },
  xls: { mime: 'application/vnd.ms-excel', grupo: 'planilha' },
  ppt: { mime: 'application/vnd.ms-powerpoint', grupo: 'apresentacao' },
};

const comeca = (buffer, bytes, inicio = 0) => bytes.every((byte, i) => buffer[inicio + i] === byte);

/** Identifica uma imagem JPEG, PNG ou WebP pelo conteúdo. */
export function identificarImagem(buffer) {
  if (comeca(buffer, [0xff, 0xd8, 0xff])) return { extensao: 'jpg', mime: 'image/jpeg', grupo: 'imagem', inline: true };
  if (comeca(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extensao: 'png', mime: 'image/png', grupo: 'imagem', inline: true };
  }
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') {
    return { extensao: 'webp', mime: 'image/webp', grupo: 'imagem', inline: true };
  }
  return null;
}

/** Identifica um documento aceito (PDF, Office ou imagem) ou devolve null. */
export function identificarDocumento(buffer, nomeOriginal = '') {
  if (buffer.subarray(0, 1024).includes('%PDF-')) return { extensao: 'pdf', mime: 'application/pdf', grupo: 'pdf', inline: true };
  const imagem = identificarImagem(buffer);
  if (imagem) return imagem;

  // Formatos do Office: o conteúdo diz a "família" (ZIP ou o formato antigo) e a extensão diz qual programa.
  const extensao = path.extname(nomeOriginal).slice(1).toLowerCase();
  if (comeca(buffer, [0x50, 0x4b, 0x03, 0x04]) && OFFICE_ZIP[extensao]) return { extensao, ...OFFICE_ZIP[extensao], inline: false };
  if (comeca(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) && OFFICE_ANTIGO[extensao]) {
    return { extensao, ...OFFICE_ANTIGO[extensao], inline: false };
  }
  return null;
}

/** Nome de arquivo para guardar e exibir: sem pastas, sem caracteres de controle e com tamanho limitado. */
export function nomeLimpo(nomeOriginal, extensao) {
  const base = path
    .basename(nomeOriginal || '')
    .replace(/[\p{Cc}"\\/]/gu, '')
    .trim();
  const nome = base || `arquivo.${extensao}`;
  return nome.length > 200 ? `${nome.slice(0, 190)}.${extensao}` : nome;
}

/**
 * Cabeçalho Content-Disposition com nome acentuado: "filename" leva uma versão sem acentos (navegadores
 * antigos) e "filename*" o nome original em UTF-8 (RFC 6266).
 */
export function disposicao(nome, inline) {
  const semAcentos = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '_');
  return `${inline ? 'inline' : 'attachment'}; filename="${semAcentos}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}
