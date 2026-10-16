import { estadoVazio, render } from '../core/ui.js';

export default function paginaNaoEncontrada({ el }) {
  render(
    el,
    estadoVazio({
      icone: 'signpost-split',
      titulo: 'Página não encontrada',
      texto: 'O endereço pode estar errado ou a página foi removida.',
      acao: { href: '#/inicio', rotulo: 'Ir para o início' },
    }),
  );
}
