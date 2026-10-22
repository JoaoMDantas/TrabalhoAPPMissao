import { escaparHtml } from './ui.js';

const LEAFLET = '/vendor/leaflet';
export const CENTRO_SAO_LUIS = [-2.5307, -44.3068];

let leaflet;

/** Carrega o Leaflet (biblioteca do mapa) só quando alguma tela precisa dele. */
export async function carregarLeaflet() {
  if (!leaflet) {
    if (!document.querySelector('link[data-leaflet]')) {
      const estilo = document.createElement('link');
      estilo.rel = 'stylesheet';
      estilo.href = `${LEAFLET}/leaflet.css`;
      estilo.dataset.leaflet = '';
      const carregado = new Promise((resolver) => {
        estilo.onload = resolver;
        estilo.onerror = resolver;
      });
      document.head.append(estilo);
      await carregado;
    }
    leaflet = await import(`${LEAFLET}/leaflet-src.esm.js`);
  }
  return leaflet;
}

/**
 * Cria um mapa do OpenStreetMap no elemento. Devolve { L, mapa }.
 * Com "aoSair" (da tela), o mapa é encerrado quando a pessoa troca de tela.
 */
export async function criarMapa(elemento, { centro = CENTRO_SAO_LUIS, zoom = 12, aoSair, ...opcoes } = {}) {
  const L = await carregarLeaflet();
  const mapa = L.map(elemento, opcoes).setView(centro, zoom);
  // Espera a animação de zoom (250 ms) terminar: o Leaflet 1.9 dá erro se o mapa for removido no meio dela.
  aoSair?.(() => setTimeout(() => mapa.remove(), 300));
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(mapa);
  return { L, mapa };
}

/** Marcador em forma de alfinete, nas cores do app, com um ícone do Bootstrap Icons. */
export function icone(L, { simbolo = 'geo-alt-fill', classe = '' } = {}) {
  return L.divIcon({
    className: `marcador ${classe}`,
    html: `<span class="marcador-alfinete"><i class="bi bi-${escaparHtml(simbolo)}" aria-hidden="true"></i></span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
}

export const temLocalizacao = (item) => item.latitude !== null && item.longitude !== null;

/** Rotas no Google Maps e no Waze (abrem o aplicativo do celular, se instalado). */
export const linkComoChegar = ({ latitude, longitude }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
export const linkWaze = ({ latitude, longitude }) => `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
