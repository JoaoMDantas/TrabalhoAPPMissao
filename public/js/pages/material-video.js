import { api } from '../core/api.js';
import { alternarConcluido, lerConcluidos } from '../core/progresso.js';
import { avisar, blocoErro, html, render } from '../core/ui.js';
import { dadosYoutube, enderecoIncorporado } from '../core/youtube.js';

function botaoConcluir(concluido) {
  return concluido
    ? html`<i class="bi bi-check-circle-fill" aria-hidden="true"></i> Concluído`
    : html`<i class="bi bi-check2-circle" aria-hidden="true"></i> Marcar como concluído`;
}

export default async function paginaVideoMaterial({ el, params }) {
  const id = Number(params.id);
  const material = await api.get(`/materiais/${id}`);
  const dados = dadosYoutube(material.url);
  if (!dados) {
    render(el, blocoErro({ message: 'Este material não é um vídeo do YouTube. Abra-o pela lista da trilha.' }));
    return;
  }

  render(
    el,
    html`
      <section class="cartao cartao-video">
        <div class="video-youtube video-grande">
          <iframe src="${enderecoIncorporado(dados)}" title="${material.titulo}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <div class="p-3">
          <h1 class="h6 fw-bold mb-1">${material.titulo}</h1>
          ${material.descricao ? html`<p class="small text-body-secondary mb-3">${material.descricao}</p>` : ''}
          <div class="d-flex flex-wrap align-items-center gap-2">
            <button type="button" class="btn btn-outline-success btn-sm" data-concluir></button>
            <a class="btn btn-link btn-sm" href="${material.url}" target="_blank" rel="noopener">Abrir no YouTube</a>
          </div>
          <p class="small text-body-secondary mt-3 mb-0">
            <i class="bi bi-wifi" aria-hidden="true"></i> Os vídeos precisam de internet; os PDFs da trilha podem ser lidos sem ela.
          </p>
        </div>
      </section>`,
  );

  const botao = el.querySelector('[data-concluir]');
  const atualizar = () => render(botao, botaoConcluir(lerConcluidos().has(id)));
  atualizar();
  botao.addEventListener('click', () => {
    const concluido = alternarConcluido(id);
    atualizar();
    avisar(concluido ? 'Material marcado como concluído.' : 'Material desmarcado.');
  });
}
