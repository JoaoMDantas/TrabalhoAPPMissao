import { itemIgreja } from '../components/igreja.js';
import { api } from '../core/api.js';
import { sessao } from '../core/sessao.js';
import { atrasar, blocoErro, carregando, estadoVazio, html, render } from '../core/ui.js';

export default async function paginaIgrejas({ el, query }) {
  const podeCadastrar = sessao.usuario.papel !== 'missionario';
  const buscaInicial = query.busca ?? '';

  render(
    el,
    html`
      <div class="campo-busca mb-3">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input type="search" class="form-control" placeholder="Buscar por nome, bairro ou cidade" aria-label="Buscar igrejas"
          value="${buscaInicial}" data-busca>
      </div>
      <div class="lista" data-lista>${carregando()}</div>
      ${podeCadastrar
        ? html`<a class="botao-flutuante" href="#/igrejas/nova" aria-label="Cadastrar igreja"><i class="bi bi-plus-lg"></i></a>`
        : ''}`,
  );

  const lista = el.querySelector('[data-lista]');
  let ultimaConsulta = 0;

  async function carregar(busca) {
    const consulta = ++ultimaConsulta;
    try {
      const igrejas = await api.get('/igrejas', { busca });
      if (consulta !== ultimaConsulta) return;
      render(
        lista,
        igrejas.length
          ? igrejas.map(itemIgreja)
          : estadoVazio({
              icone: 'building',
              titulo: busca ? 'Nenhuma igreja encontrada' : 'Nenhuma igreja cadastrada',
              acao: podeCadastrar && !busca ? { href: '#/igrejas/nova', rotulo: 'Cadastrar igreja' } : null,
            }),
      );
    } catch (erro) {
      if (consulta === ultimaConsulta) render(lista, blocoErro(erro));
    }
  }

  el.querySelector('[data-busca]').addEventListener(
    'input',
    atrasar((evento) => {
      const busca = evento.target.value.trim();
      // Guarda a busca no endereço, para que ela continue ao voltar de uma igreja.
      window.history.replaceState(null, '', busca ? `#/igrejas?busca=${encodeURIComponent(busca)}` : '#/igrejas');
      carregar(busca);
    }),
  );

  await carregar(buscaInicial);
}
