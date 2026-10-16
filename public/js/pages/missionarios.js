import { itemPessoa } from '../components/pessoa.js';
import { api } from '../core/api.js';
import { atrasar, blocoErro, carregando, estadoVazio, html, render } from '../core/ui.js';

const FILTROS = [
  { papel: 'missionario', rotulo: 'Missionários' },
  { papel: 'lider', rotulo: 'Líderes' },
  { papel: '', rotulo: 'Todos' },
];

function linkFiltro(papel, busca) {
  const parametros = new URLSearchParams();
  if (papel !== 'missionario') parametros.set('papel', papel || 'todos');
  if (busca) parametros.set('busca', busca);
  const texto = parametros.toString();
  return `#/missionarios${texto ? `?${texto}` : ''}`;
}

export default async function paginaMissionarios({ el, query }) {
  // Sem parâmetro mostra missionários; "todos" mostra qualquer papel.
  const papel = query.papel === 'todos' ? '' : FILTROS.some((f) => f.papel === query.papel) ? query.papel : 'missionario';
  let busca = query.busca ?? '';

  render(
    el,
    html`
      <div class="campo-busca mb-3">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input type="search" class="form-control" placeholder="Buscar por nome, igreja ou bairro" aria-label="Buscar pessoas"
          value="${busca}" data-busca>
      </div>
      <div class="filtros-chips" role="group" aria-label="Filtrar por papel">
        ${FILTROS.map(
          (filtro) => html`<a class="chip ${filtro.papel === papel ? 'ativo' : ''}" href="${linkFiltro(filtro.papel, busca)}"
            data-papel="${filtro.papel}">${filtro.rotulo}</a>`,
        )}
      </div>
      <div class="lista" data-lista>${carregando()}</div>`,
  );

  const lista = el.querySelector('[data-lista]');
  let ultimaConsulta = 0;

  async function carregar() {
    const consulta = ++ultimaConsulta;
    try {
      const pessoas = await api.get('/usuarios', { papel, busca });
      if (consulta !== ultimaConsulta) return;
      render(
        lista,
        pessoas.length ? pessoas.map(itemPessoa) : estadoVazio({ icone: 'people', titulo: 'Nenhuma pessoa encontrada' }),
      );
    } catch (erro) {
      if (consulta === ultimaConsulta) render(lista, blocoErro(erro));
    }
  }

  el.querySelector('[data-busca]').addEventListener(
    'input',
    atrasar((evento) => {
      busca = evento.target.value.trim();
      window.history.replaceState(null, '', linkFiltro(papel, busca));
      el.querySelectorAll('[data-papel]').forEach((chip) => {
        chip.href = linkFiltro(chip.dataset.papel, busca);
      });
      carregar();
    }),
  );

  await carregar();
}
