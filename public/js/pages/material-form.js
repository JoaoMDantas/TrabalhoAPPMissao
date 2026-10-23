import { api } from '../core/api.js';
import { TIPOS_MATERIAL } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import {
  alternarEnvio,
  avisar,
  blocoErro,
  html,
  lerFormulario,
  limparErrosFormulario,
  mostrarErroFormulario,
  render,
} from '../core/ui.js';
import { dadosYoutube, miniaturaYoutube } from '../core/youtube.js';

export default async function paginaNovoMaterial({ el, navegar }) {
  if (sessao.usuario.papel === 'missionario') {
    render(el, blocoErro({ message: 'Apenas líderes e administradores podem adicionar materiais.' }));
    return;
  }

  const materiais = await api.get('/materiais');
  const etapas = [...new Set(materiais.map((material) => material.etapa))];

  render(
    el,
    html`
      <form class="cartao" novalidate>
        <div class="alert alert-danger d-none" data-erro role="alert"></div>

        <div class="mb-3">
          <label class="form-label" for="titulo">Título</label>
          <input class="form-control" id="titulo" name="titulo" maxlength="150" placeholder="Ex.: Aula sobre discipulado">
        </div>
        <div class="mb-3">
          <label class="form-label" for="tipo">Tipo</label>
          <select class="form-select" id="tipo" name="tipo">
            ${Object.entries(TIPOS_MATERIAL).map(([chave, { rotulo }]) => html`<option value="${chave}">${rotulo}</option>`)}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label" for="url">Link</label>
          <input class="form-control" id="url" name="url" type="url" inputmode="url" maxlength="500"
            placeholder="https://www.youtube.com/watch?v=...">
          <div class="form-text">Cole o endereço do vídeo, PDF ou site. Vídeos do YouTube tocam dentro do app.</div>
          <div class="previa-link" data-previa-link hidden></div>
        </div>
        <div class="mb-3">
          <label class="form-label" for="etapa">Etapa da trilha</label>
          <input class="form-control" id="etapa" name="etapa" maxlength="80" list="etapas" value="${etapas.at(-1) ?? ''}">
          <datalist id="etapas">${etapas.map((etapa) => html`<option value="${etapa}"></option>`)}</datalist>
        </div>
        <div class="mb-4">
          <label class="form-label" for="descricao">Descrição <span class="text-body-secondary">(opcional)</span></label>
          <textarea class="form-control" id="descricao" name="descricao" rows="3" maxlength="500"></textarea>
        </div>

        <button class="btn btn-primary w-100" type="submit">Adicionar à trilha</button>
      </form>`,
  );

  const form = el.querySelector('form');

  // Ao colar o link, o tipo é escolhido sozinho (YouTube → vídeo; arquivo .pdf ou Google Drive → PDF).
  const campoLink = form.elements.namedItem('url');
  const previa = el.querySelector('[data-previa-link]');
  campoLink.addEventListener('input', () => {
    const endereco = campoLink.value.trim();
    const youtube = dadosYoutube(endereco);
    if (youtube) form.elements.namedItem('tipo').value = 'video';
    else if (/\.pdf($|[?#])/i.test(endereco) || /^https:\/\/drive\.google\.com\/file\//.test(endereco)) {
      form.elements.namedItem('tipo').value = 'pdf';
    }
    previa.hidden = !youtube;
    render(
      previa,
      youtube?.video
        ? html`<img src="${miniaturaYoutube(youtube.video)}" alt=""><span>Vídeo do YouTube: vai tocar dentro do app.</span>`
        : youtube
          ? html`<span>Playlist do YouTube: vai tocar dentro do app.</span>`
          : '',
    );
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      await api.post('/materiais', lerFormulario(form));
      avisar('Material adicionado à trilha!');
      navegar('/capacitacao', { substituir: true });
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}
