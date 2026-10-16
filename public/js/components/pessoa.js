import { PAPEIS } from '../core/rotulos.js';
import { avatar, html } from '../core/ui.js';

export function itemPessoa(pessoa) {
  const detalhes = [pessoa.igreja_nome, pessoa.bairro_atuacao].filter(Boolean).join(' · ');

  return html`
    <a class="item-lista" href="#/missionarios/${pessoa.id}">
      ${avatar(pessoa.nome)}
      <div class="flex-grow-1 min-w-0">
        <div class="item-lista-titulo">${pessoa.nome}</div>
        <div class="item-lista-sub">${detalhes || 'Sem igreja informada'}</div>
      </div>
      <span class="badge rounded-pill papel-${pessoa.papel}">${PAPEIS[pessoa.papel]}</span>
    </a>`;
}
