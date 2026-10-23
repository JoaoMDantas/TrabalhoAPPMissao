import { tempoRelativo } from '../core/formatos.js';
import { PAPEIS } from '../core/rotulos.js';
import { avatar, html } from '../core/ui.js';
import { fotosDaMensagem, textoComLinks, videoDoTexto } from './midia.js';

export function itemMensagem(mensagem, { permitirExcluir = true } = {}) {
  const ehAviso = mensagem.tipo === 'aviso';

  return html`
    <article class="item-mensagem ${ehAviso ? 'aviso' : ''}" data-mensagem="${mensagem.id}">
      <header class="d-flex align-items-center gap-2">
        <a href="#/missionarios/${mensagem.autor_id}" class="text-reset">${avatar(mensagem.autor_nome)}</a>
        <div class="flex-grow-1 min-w-0">
          <a href="#/missionarios/${mensagem.autor_id}" class="fw-semibold text-reset text-decoration-none d-block text-truncate">
            ${mensagem.autor_nome}
          </a>
          <div class="small text-body-secondary">${PAPEIS[mensagem.autor_papel] ?? ''} · ${tempoRelativo(mensagem.criado_em)}</div>
        </div>
        ${ehAviso ? html`<span class="badge text-bg-warning"><i class="bi bi-megaphone" aria-hidden="true"></i> Aviso</span>` : ''}
        ${permitirExcluir && mensagem.pode_excluir
          ? html`<button type="button" class="btn-icone btn-icone-sm" data-excluir="${mensagem.id}" aria-label="Excluir mensagem">
              <i class="bi bi-trash3"></i>
            </button>`
          : ''}
      </header>
      ${mensagem.conteudo ? html`<p class="conteudo-mensagem">${textoComLinks(mensagem.conteudo)}</p>` : ''}
      ${mensagem.conteudo ? videoDoTexto(mensagem.conteudo) : ''}
      ${mensagem.fotos?.length ? fotosDaMensagem(mensagem.fotos) : ''}
      ${mensagem.igreja_id
        ? html`<a href="#/igrejas/${mensagem.igreja_id}" class="etiqueta-igreja">
            <i class="bi bi-building" aria-hidden="true"></i> ${mensagem.igreja_nome}
          </a>`
        : ''}
    </article>`;
}
