import { montarLeitorPdf } from '../components/leitor-pdf.js';
import { api } from '../core/api.js';
import { buscarPdf } from '../core/arquivos.js';
import { alternarConcluido, lerConcluidos, materialGuardado } from '../core/progresso.js';
import { avisar, html, render } from '../core/ui.js';

function botaoConcluir(concluido) {
  return concluido
    ? html`<i class="bi bi-check-circle-fill" aria-hidden="true"></i> Concluído`
    : html`<i class="bi bi-check2-circle" aria-hidden="true"></i> Marcar como concluído`;
}

export default async function paginaLeitor({ el, params, aoSair }) {
  const id = Number(params.id);

  let material;
  try {
    material = await api.get(`/materiais/${id}`);
  } catch (erro) {
    // Sem internet: usa os dados guardados pela lista da trilha; o PDF em si vem do aparelho, se já foi aberto antes.
    material = erro.status === 0 ? materialGuardado(id) : null;
    if (!material) throw erro;
  }

  const abriu = await montarLeitorPdf(el, {
    titulo: material.titulo,
    carregar: (opcoes) => buscarPdf(id, opcoes),
    enderecoOriginal: material.url,
    aviso: 'fica salvo no aparelho para ler sem internet',
    rodape: html`
      <p class="fw-semibold mb-2">Terminou a leitura?</p>
      <button type="button" class="btn btn-outline-success btn-sm" data-concluir></button>
      <a class="btn btn-link btn-sm" href="${material.url}" target="_blank" rel="noopener">Abrir no site original</a>`,
    aoSair,
  });
  if (!abriu) return;

  const atualizarConcluido = () => render(el.querySelector('[data-concluir]'), botaoConcluir(lerConcluidos().has(id)));
  atualizarConcluido();
  el.addEventListener('click', (evento) => {
    if (!evento.target.closest('[data-concluir]')) return;
    const concluido = alternarConcluido(id);
    atualizarConcluido();
    avisar(concluido ? 'Material marcado como concluído.' : 'Material desmarcado.');
  });
}
