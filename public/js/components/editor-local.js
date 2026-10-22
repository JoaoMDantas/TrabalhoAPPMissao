import { alternarEnvio, avisar, html, limparErrosFormulario, mostrarErroFormulario, render } from '../core/ui.js';
import { montarSeletorLocal } from './seletor-local.js';

/**
 * Tela de "Ajustar no mapa": um mapa grande só para mudar o local (de uma igreja, de uma visita...).
 * "salvar({ latitude, longitude })" grava no servidor; depois volta para "voltarPara".
 */
export async function montarEditorLocal({
  el,
  aoSair,
  navegar,
  titulo,
  descricao,
  latitude = null,
  longitude = null,
  simbolo,
  permiteRemover = true,
  salvar,
  voltarPara,
}) {
  render(
    el,
    html`
      <section class="cartao">
        <h1 class="h6 fw-bold mb-1">${titulo}</h1>
        <p class="small text-body-secondary mb-3">${descricao}</p>
        <form novalidate>
          <div class="alert alert-danger d-none" data-erro role="alert"></div>
          <div data-seletor-local></div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-primary flex-fill" type="submit"><i class="bi bi-check-lg" aria-hidden="true"></i> Salvar local</button>
            <a class="btn btn-light" href="#${voltarPara}">Cancelar</a>
          </div>
        </form>
      </section>`,
  );

  const form = el.querySelector('form');
  await montarSeletorLocal(el.querySelector('[data-seletor-local]'), {
    latitude,
    longitude,
    simbolo,
    permiteRemover,
    classeMapa: 'mapa-editor',
    ajuda: 'Arraste o alfinete, toque no mapa ou use a sua localização.',
    aoSair,
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const novaLatitude = form.elements.namedItem('latitude').value;
    const novaLongitude = form.elements.namedItem('longitude').value;
    if (!permiteRemover && !novaLatitude) {
      mostrarErroFormulario(form, { message: 'Marque o local no mapa.' });
      return;
    }

    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true, 'Salvando...');
    try {
      await salvar({ latitude: novaLatitude, longitude: novaLongitude });
      avisar(novaLatitude ? 'Local atualizado no mapa.' : 'Marcação removida do mapa.');
      navegar(voltarPara, { substituir: true });
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}
