import { html } from '../core/ui.js';

export const itemIgreja = (igreja) => html`
  <a class="item-lista" href="#/igrejas/${igreja.id}">
    <span class="icone-quadrado"><i class="bi bi-building" aria-hidden="true"></i></span>
    <div class="flex-grow-1 min-w-0">
      <div class="item-lista-titulo">${igreja.nome}</div>
      <div class="item-lista-sub">${igreja.bairro} · ${igreja.cidade}</div>
    </div>
    <span class="badge rounded-pill text-bg-light" title="Pessoas vinculadas">
      <i class="bi bi-people" aria-hidden="true"></i> ${igreja.total_membros}
    </span>
  </a>`;
