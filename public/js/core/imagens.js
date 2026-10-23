/** Abre a imagem escolhida para desenhar no canvas, já na orientação certa (fotos de celular "deitadas"). */
async function abrirImagem(arquivo) {
  if ('createImageBitmap' in window) {
    try {
      const imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
      return { imagem, liberar: () => imagem.close() };
    } catch {
      // Navegador antigo ou formato não suportado aqui: tenta pelo <img>.
    }
  }
  const endereco = URL.createObjectURL(arquivo);
  const imagem = new Image();
  imagem.src = endereco;
  try {
    await imagem.decode();
  } catch {
    URL.revokeObjectURL(endereco);
    throw new Error('Um dos arquivos escolhidos não parece ser uma foto.');
  }
  return { imagem, liberar: () => URL.revokeObjectURL(endereco) };
}

/**
 * Reduz a foto no próprio celular antes de enviar: no máximo 1600 px no lado maior, em JPEG.
 * O envio fica mais rápido (gasta menos internet) e a foto perde os dados escondidos da imagem,
 * como a localização do GPS.
 */
export async function reduzirFoto(arquivo, { ladoMaximo = 1600, qualidade = 0.82 } = {}) {
  const { imagem, liberar } = await abrirImagem(arquivo);
  try {
    const escala = Math.min(1, ladoMaximo / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(imagem.width * escala));
    canvas.height = Math.max(1, Math.round(imagem.height * escala));
    const contexto = canvas.getContext('2d');
    // Imagens com transparência (PNG) ganham fundo branco no JPEG.
    contexto.fillStyle = '#fff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    const foto = await new Promise((resolver) => canvas.toBlob(resolver, 'image/jpeg', qualidade));
    if (!foto) throw new Error('Não foi possível preparar a foto. Tente outra imagem.');
    return foto;
  } finally {
    liberar();
  }
}
