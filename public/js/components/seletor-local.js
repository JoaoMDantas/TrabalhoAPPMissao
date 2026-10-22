import { api } from '../core/api.js';
import { criarMapa, icone } from '../core/mapa.js';
import { avisar, html, render } from '../core/ui.js';

const arredondar = (valor) => Math.round(valor * 1e6) / 1e6;
// "Rua X, Cohatrac IV, São Luís, Região..., Maranhão, Brasil" -> "Rua X, Cohatrac IV, São Luís"
const nomeCurto = (nome) => nome.split(', ').slice(0, 3).join(', ');

const ICONE_CARREGANDO = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>';

/**
 * Campo de localização para formulários: um mapa em que a pessoa toca para marcar o ponto, com busca de
 * endereço e "usar minha localização". Grava as coordenadas nos campos ocultos "latitude" e "longitude".
 */
export async function montarSeletorLocal(
  container,
  { latitude = null, longitude = null, simbolo = 'geo-alt-fill', ajuda = 'Toque no mapa para marcar o local.', aoSair } = {},
) {
  render(
    container,
    html`
      <div class="d-flex gap-2 mb-2">
        <div class="campo-busca flex-grow-1">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input type="search" class="form-control" placeholder="Rua, número e bairro" aria-label="Buscar endereço no mapa"
            enterkeyhint="search" data-busca-endereco>
        </div>
        <button type="button" class="btn btn-outline-primary" data-buscar>Buscar</button>
        <button type="button" class="btn btn-outline-primary" data-minha-localizacao title="Usar minha localização"
          aria-label="Usar minha localização"><i class="bi bi-crosshair" aria-hidden="true"></i></button>
      </div>
      <div class="list-group resultados-endereco mb-2" data-resultados hidden></div>
      <div class="mapa mapa-seletor" data-mapa></div>
      <div class="d-flex justify-content-between align-items-start gap-2 mt-1">
        <span class="form-text mt-0" data-ajuda>${ajuda}</span>
        <button type="button" class="btn btn-link btn-sm p-0" data-remover hidden>Remover marcação</button>
      </div>
      <input type="hidden" name="latitude" value="${latitude ?? ''}">
      <input type="hidden" name="longitude" value="${longitude ?? ''}">`,
  );

  const temPonto = latitude !== null && longitude !== null;
  const { L, mapa } = await criarMapa(container.querySelector('[data-mapa]'), {
    ...(temPonto ? { centro: [latitude, longitude], zoom: 17 } : {}),
    aoSair,
  });

  const campoLatitude = container.querySelector('[name="latitude"]');
  const campoLongitude = container.querySelector('[name="longitude"]');
  const textoAjuda = container.querySelector('[data-ajuda]');
  const botaoRemover = container.querySelector('[data-remover]');
  const campoBusca = container.querySelector('[data-busca-endereco]');
  const resultados = container.querySelector('[data-resultados]');
  let marcador = null;

  function gravar({ lat, lng }) {
    campoLatitude.value = arredondar(lat);
    campoLongitude.value = arredondar(lng);
    botaoRemover.hidden = false;
    textoAjuda.textContent = 'Local marcado. Se precisar, arraste o alfinete para ajustar.';
    container.querySelector('.mapa').classList.remove('mapa-invalido');
  }

  function trocarSimbolo(novo) {
    simbolo = novo;
    marcador?.setIcon(icone(L, { simbolo }));
  }

  function marcar(lat, lng, { centralizar = false } = {}) {
    if (!marcador) {
      marcador = L.marker([lat, lng], { icon: icone(L, { simbolo }), draggable: true, autoPan: true, title: 'Local marcado' }).addTo(mapa);
      marcador.on('dragend', () => gravar(marcador.getLatLng()));
    } else {
      marcador.setLatLng([lat, lng]);
    }
    gravar({ lat, lng });
    if (centralizar) mapa.setView([lat, lng], Math.max(mapa.getZoom(), 17));
  }

  function limpar() {
    marcador?.remove();
    marcador = null;
    campoLatitude.value = '';
    campoLongitude.value = '';
    botaoRemover.hidden = true;
    textoAjuda.textContent = ajuda;
  }

  if (temPonto) marcar(latitude, longitude);
  mapa.on('click', (evento) => marcar(evento.latlng.lat, evento.latlng.lng));
  botaoRemover.addEventListener('click', limpar);

  async function buscar() {
    const termo = campoBusca.value.trim();
    if (termo.length < 3) {
      avisar('Digite pelo menos 3 letras do endereço.', 'erro');
      return;
    }
    render(resultados, html`<div class="list-group-item small text-body-secondary">Procurando…</div>`);
    resultados.hidden = false;
    try {
      const lugares = await api.get('/localizacao/buscar', { q: termo });
      render(
        resultados,
        lugares.length
          ? lugares.map(
              (lugar, i) => html`
                <button type="button" class="list-group-item list-group-item-action small" data-lugar="${i}">
                  <i class="bi bi-geo-alt" aria-hidden="true"></i> ${nomeCurto(lugar.nome)}
                </button>`,
            )
          : html`<div class="list-group-item small text-body-secondary">
              Nenhum endereço encontrado. Tente o nome da rua e o bairro, ou toque direto no mapa.
            </div>`,
      );
      resultados.onclick = (evento) => {
        const botao = evento.target.closest('[data-lugar]');
        if (!botao) return;
        const lugar = lugares[Number(botao.dataset.lugar)];
        marcar(lugar.latitude, lugar.longitude, { centralizar: true });
        resultados.hidden = true;
      };
    } catch (erro) {
      resultados.hidden = true;
      avisar(erro.message, 'erro');
    }
  }

  container.querySelector('[data-buscar]').addEventListener('click', buscar);
  // Enter no campo de busca procura o endereço em vez de enviar o formulário.
  campoBusca.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Enter') return;
    evento.preventDefault();
    buscar();
  });

  const botaoLocalizacao = container.querySelector('[data-minha-localizacao]');
  botaoLocalizacao.addEventListener('click', () => {
    if (!navigator.geolocation) {
      avisar('Este aparelho não informa a localização.', 'erro');
      return;
    }
    const conteudo = botaoLocalizacao.innerHTML;
    botaoLocalizacao.disabled = true;
    botaoLocalizacao.innerHTML = ICONE_CARREGANDO;
    const restaurar = () => {
      botaoLocalizacao.disabled = false;
      botaoLocalizacao.innerHTML = conteudo;
    };
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        restaurar();
        marcar(posicao.coords.latitude, posicao.coords.longitude, { centralizar: true });
      },
      (erro) => {
        restaurar();
        avisar(
          erro.code === erro.PERMISSION_DENIED
            ? 'Permita o acesso à localização nas configurações do navegador para usar este botão.'
            : 'Não foi possível obter sua localização. Verifique se o GPS está ligado.',
          'erro',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });

  return { marcar, limpar, trocarSimbolo, mapa };
}
