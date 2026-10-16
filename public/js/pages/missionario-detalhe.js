import { botoesContato } from '../components/contato.js';
import { itemEvento } from '../components/evento.js';
import { api } from '../core/api.js';
import { agoraParaApi } from '../core/formatos.js';
import { PAPEIS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import { avatar, estadoVazio, html, render } from '../core/ui.js';

export default async function paginaPessoa({ el, params }) {
  const id = Number(params.id);
  const [pessoa, eventos] = await Promise.all([
    api.get(`/usuarios/${id}`),
    api.get('/eventos', { criado_por: id, de: agoraParaApi(), limite: 5 }),
  ]);
  const ehEu = pessoa.id === sessao.usuario.id;

  render(
    el,
    html`
      <section class="cartao text-center">
        ${avatar(pessoa.nome, 'lg')}
        <h1 class="h4 fw-bold mt-3 mb-1">${pessoa.nome}</h1>
        <span class="badge rounded-pill papel-${pessoa.papel}">${PAPEIS[pessoa.papel]}</span>

        <ul class="lista-info text-start mt-3">
          <li>
            <i class="bi bi-building" aria-hidden="true"></i>
            ${pessoa.igreja_id
              ? html`<a href="#/igrejas/${pessoa.igreja_id}">${pessoa.igreja_nome}</a>`
              : html`<span class="text-body-secondary">Sem igreja informada</span>`}
          </li>
          <li>
            <i class="bi bi-geo-alt" aria-hidden="true"></i>
            ${pessoa.bairro_atuacao
              ? html`<span>Atua em ${pessoa.bairro_atuacao}</span>`
              : html`<span class="text-body-secondary">Bairro de atuação não informado</span>`}
          </li>
          <li><i class="bi bi-envelope" aria-hidden="true"></i><span class="text-break">${pessoa.email}</span></li>
        </ul>
        ${pessoa.sobre ? html`<p class="texto-livre text-start mt-2 mb-0">${pessoa.sobre}</p>` : ''}
        <div class="mt-3">${botoesContato(pessoa, 'justify-content-center')}</div>
      </section>

      ${ehEu
        ? html`<a class="btn btn-outline-primary w-100 mt-3" href="#/perfil"><i class="bi bi-pencil" aria-hidden="true"></i> Editar meu perfil</a>`
        : ''}

      <div class="secao-titulo"><h2>Próximas atividades organizadas</h2></div>
      <div class="lista">
        ${eventos.length
          ? eventos.map((evento) => itemEvento(evento))
          : estadoVazio({ icone: 'calendar-x', titulo: 'Nenhuma atividade agendada' })}
      </div>`,
  );
}
