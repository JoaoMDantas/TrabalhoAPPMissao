const ID_DE_VIDEO = /^[\w-]{11}$/;
const ID_DE_LISTA = /^[\w-]+$/;

/**
 * Lê um link do YouTube (watch, youtu.be, shorts, embed, live; com ou sem playlist) e devolve
 * { video, lista } ou null se não for um link do YouTube.
 */
export function dadosYoutube(endereco) {
  let url;
  try {
    url = new URL(endereco);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let video = null;
  if (host === 'youtu.be') {
    video = url.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, tipo, id] = url.pathname.split('/');
    if (tipo === 'watch') video = url.searchParams.get('v');
    else if (['shorts', 'embed', 'live', 'v'].includes(tipo)) video = id;
  } else {
    return null;
  }

  const lista = url.searchParams.get('list');
  const dados = {
    video: video && ID_DE_VIDEO.test(video) ? video : null,
    lista: lista && ID_DE_LISTA.test(lista) ? lista : null,
  };
  return dados.video || dados.lista ? dados : null;
}

export const miniaturaYoutube = (video) => `https://i.ytimg.com/vi/${video}/hqdefault.jpg`;

/** Endereço do player do YouTube em modo de privacidade reforçada (youtube-nocookie.com). */
export function enderecoIncorporado({ video, lista }, { autoplay = false } = {}) {
  const parametros = new URLSearchParams({ rel: '0' });
  if (autoplay) parametros.set('autoplay', '1');
  if (lista) parametros.set('list', lista);
  return `https://www.youtube-nocookie.com/embed/${video ?? 'videoseries'}?${parametros}`;
}
