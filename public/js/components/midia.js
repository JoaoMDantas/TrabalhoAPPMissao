import { html } from '../core/ui.js';
import { dadosYoutube, enderecoIncorporado, miniaturaYoutube } from '../core/youtube.js';
import { abrirVisualizador } from './visualizador.js';

const LINK_NO_TEXTO = /https?:\/\/[^\s<>"']+/gi;
// Pontuação colada no fim do link ("veja https://site.com.") não faz parte dele.
const PONTUACAO_FINAL = /[.,;:!?)\]]+$/;

function linksDoTexto(texto) {
  return [...texto.matchAll(LINK_NO_TEXTO)].map((encontrado) => {
    const endereco = encontrado[0].replace(PONTUACAO_FINAL, '');
    return { endereco, inicio: encontrado.index, fim: encontrado.index + endereco.length };
  });
}

/** Texto com os links (http e https) clicáveis; todo o resto continua escapado. */
export function textoComLinks(texto) {
  const partes = [];
  let posicao = 0;
  for (const { endereco, inicio, fim } of linksDoTexto(texto)) {
    partes.push(texto.slice(posicao, inicio));
    partes.push(html`<a href="${endereco}" target="_blank" rel="noopener noreferrer nofollow ugc">${endereco}</a>`);
    posicao = fim;
  }
  partes.push(texto.slice(posicao));
  return partes;
}

/**
 * Capa do vídeo do YouTube: o player (e o próprio YouTube) só carrega quando a pessoa toca para assistir,
 * o que economiza internet e evita rastreamento de quem só está passando pelo mural.
 */
export function cartaoYoutube(dados, { titulo = 'Vídeo do YouTube' } = {}) {
  return html`
    <div class="video-youtube" data-video-incorporado="${enderecoIncorporado(dados, { autoplay: true })}">
      <button type="button" class="video-capa" aria-label="Assistir: ${titulo}">
        ${dados.video
          ? html`<img src="${miniaturaYoutube(dados.video)}" alt="" loading="lazy" decoding="async">`
          : html`<span class="video-sem-capa"><i class="bi bi-collection-play" aria-hidden="true"></i> Playlist do YouTube</span>`}
        <span class="video-play" aria-hidden="true"><i class="bi bi-play-fill"></i></span>
      </button>
    </div>`;
}

/** Primeiro vídeo do YouTube citado no texto (ou nada). */
export function videoDoTexto(texto) {
  for (const { endereco } of linksDoTexto(texto)) {
    const dados = dadosYoutube(endereco);
    if (dados) return cartaoYoutube(dados);
  }
  return '';
}

export const fotosDaMensagem = (fotos) => html`
  <div class="fotos-mensagem fotos-${Math.min(fotos.length, 4)}">
    ${fotos.map(
      (foto, i) => html`
        <button type="button" class="foto-mensagem" data-foto="${i}" aria-label="Ampliar foto ${i + 1} de ${fotos.length}">
          <img src="${foto.url}" alt="Foto ${i + 1} da mensagem" loading="lazy" decoding="async">
        </button>`,
    )}
  </div>`;

function tocarVideo(caixa) {
  const player = document.createElement('iframe');
  player.src = caixa.dataset.videoIncorporado;
  player.title = 'Vídeo do YouTube';
  player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  player.allowFullscreen = true;
  // O YouTube recusa tocar sem saber de qual site vem o player; o app, por padrão, não informa (no-referrer).
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  caixa.replaceChildren(player);
}

// Um único "ouvinte" para o app todo: vale no mural, na tela inicial ou onde a mensagem aparecer.
document.addEventListener('click', (evento) => {
  const capa = evento.target.closest('.video-capa');
  if (capa) {
    tocarVideo(capa.closest('[data-video-incorporado]'));
    return;
  }
  const foto = evento.target.closest('.foto-mensagem');
  if (foto) {
    const imagens = [...foto.closest('.fotos-mensagem').querySelectorAll('img')].map((img) => ({ src: img.src, alt: img.alt }));
    abrirVisualizador(imagens, Number(foto.dataset.foto));
  }
});
