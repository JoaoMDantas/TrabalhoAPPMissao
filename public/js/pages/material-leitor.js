import { api } from '../core/api.js';
import { buscarPdf, salvarArquivo } from '../core/arquivos.js';
import { alternarConcluido, lerConcluidos, materialGuardado } from '../core/progresso.js';
import { avisar, html, render } from '../core/ui.js';

const PDFJS = '/vendor/pdfjs';
const ZOOMS = [1, 1.5, 2, 3];
// Acima disso a nitidez quase não melhora e o celular gasta muita memória.
const NITIDEZ_MAXIMA = 2;

let bibliotecaPdf;

/** Carrega o PDF.js só na primeira leitura (são ~2 MB que a maioria das telas não precisa). */
async function carregarPdfJs() {
  if (!bibliotecaPdf) {
    bibliotecaPdf = await import(`${PDFJS}/build/pdf.min.mjs`);
    bibliotecaPdf.GlobalWorkerOptions.workerSrc = `${PDFJS}/build/pdf.worker.min.mjs`;
  }
  return bibliotecaPdf;
}

const megabytes = (bytes) => (bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function textoProgresso(recebidos, total) {
  if (!total) return `Baixando… ${megabytes(recebidos)} MB`;
  return `Baixando… ${Math.round((recebidos / total) * 100)}% de ${megabytes(total)} MB`;
}

function botaoConcluir(concluido) {
  return concluido
    ? html`<i class="bi bi-check-circle-fill" aria-hidden="true"></i> Concluído`
    : html`<i class="bi bi-check2-circle" aria-hidden="true"></i> Marcar como concluído`;
}

export default async function paginaLeitor({ el, params, aoSair }) {
  const id = Number(params.id);
  const controle = new AbortController();
  aoSair(() => controle.abort());

  let material;
  try {
    material = await api.get(`/materiais/${id}`);
  } catch (erro) {
    // Sem internet: usa os dados guardados pela lista da trilha; o PDF em si vem do aparelho, se já foi aberto antes.
    material = erro.status === 0 ? materialGuardado(id) : null;
    if (!material) throw erro;
  }

  render(
    el,
    html`
      <section class="cartao leitor-cabecalho">
        <h1 class="h6 fw-bold mb-1">${material.titulo}</h1>
        <p class="small text-body-secondary mb-0" data-estado role="status">Preparando o leitor…</p>
      </section>
      <div class="leitor-barra" data-barra hidden>
        <span class="leitor-paginacao" data-paginacao aria-live="polite"></span>
        <div class="btn-group btn-group-sm" role="group" aria-label="Tamanho da página">
          <button type="button" class="btn btn-light" data-zoom="-1" aria-label="Diminuir"><i class="bi bi-zoom-out"></i></button>
          <button type="button" class="btn btn-light" data-zoom="1" aria-label="Aumentar"><i class="bi bi-zoom-in"></i></button>
        </div>
        <button type="button" class="btn btn-outline-primary btn-sm" data-baixar>
          <i class="bi bi-download" aria-hidden="true"></i> Baixar
        </button>
      </div>
      <div class="leitor-paginas" data-paginas></div>
      <section class="cartao leitor-fim" data-fim hidden>
        <p class="fw-semibold mb-2">Terminou a leitura?</p>
        <button type="button" class="btn btn-outline-success btn-sm" data-concluir></button>
        <a class="btn btn-link btn-sm" href="${material.url}" target="_blank" rel="noopener">Abrir no site original</a>
      </section>`,
  );

  const estado = el.querySelector('[data-estado]');
  const mostrarErro = (mensagem) =>
    render(
      el.querySelector('[data-paginas]'),
      html`
        <div class="cartao text-center leitor-erro">
          <i class="bi bi-file-earmark-x" aria-hidden="true"></i>
          <p class="fw-semibold mb-1">Não foi possível abrir este PDF no aplicativo.</p>
          <p class="small text-body-secondary">${mensagem}</p>
          <a class="btn btn-primary" href="${material.url}" target="_blank" rel="noopener">Abrir no site original</a>
        </div>`,
    );

  let pdfjs;
  let arquivo;
  try {
    [pdfjs, arquivo] = await Promise.all([
      carregarPdfJs(),
      buscarPdf(id, { sinal: controle.signal, aoProgredir: (recebidos, total) => (estado.textContent = textoProgresso(recebidos, total)) }),
    ]);
  } catch (erro) {
    if (erro.name === 'AbortError') return;
    estado.textContent = 'Falha ao carregar.';
    mostrarErro(erro.message);
    return;
  }
  if (controle.signal.aborted) return;

  // O PDF.js recebe uma cópia: o original fica guardado para o botão "Baixar".
  const tarefa = pdfjs.getDocument({
    data: new Uint8Array(await arquivo.blob.arrayBuffer()),
    cMapUrl: `${PDFJS}/cmaps/`,
    standardFontDataUrl: `${PDFJS}/standard_fonts/`,
    wasmUrl: `${PDFJS}/wasm/`,
    iccUrl: `${PDFJS}/iccs/`,
  });
  aoSair(() => tarefa.destroy());

  let pdf;
  try {
    pdf = await tarefa.promise;
  } catch (erro) {
    if (controle.signal.aborted) return;
    console.error(erro);
    estado.textContent = 'Falha ao abrir.';
    mostrarErro('O arquivo parece estar corrompido ou protegido.');
    return;
  }

  const paginas = el.querySelector('[data-paginas]');
  const paginacao = el.querySelector('[data-paginacao]');
  const fim = el.querySelector('[data-fim]');
  const primeira = (await pdf.getPage(1)).getViewport({ scale: 1 });
  let zoom = 0;

  estado.textContent = `${pdf.numPages} ${pdf.numPages === 1 ? 'página' : 'páginas'} · fica salvo no aparelho para ler sem internet`;
  render(
    paginas,
    Array.from({ length: pdf.numPages }, (_, i) => html`
      <div class="leitor-pagina" data-pagina="${i + 1}" style="aspect-ratio: ${primeira.width} / ${primeira.height}"
        role="img" aria-label="Página ${i + 1}"></div>`),
  );
  el.querySelector('[data-barra]').hidden = false;
  fim.hidden = false;

  async function desenhar(div) {
    if (div.dataset.estado) return;
    div.dataset.estado = 'desenhando';
    try {
      const pagina = await pdf.getPage(Number(div.dataset.pagina));
      const base = pagina.getViewport({ scale: 1 });
      div.style.aspectRatio = `${base.width} / ${base.height}`;
      const viewport = pagina.getViewport({ scale: div.clientWidth / base.width });
      const nitidez = Math.min(window.devicePixelRatio || 1, NITIDEZ_MAXIMA);
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * nitidez);
      canvas.height = Math.floor(viewport.height * nitidez);
      div.renderizacao = pagina.render({
        canvasContext: canvas.getContext('2d'),
        viewport,
        transform: nitidez === 1 ? null : [nitidez, 0, 0, nitidez, 0, 0],
      });
      await div.renderizacao.promise;
      if (div.dataset.estado !== 'desenhando') return;
      div.replaceChildren(canvas);
      div.dataset.estado = 'pronta';
    } catch (erro) {
      if (erro?.name !== 'RenderingCancelledException') console.error(erro);
      delete div.dataset.estado;
    }
  }

  // Libera a memória das páginas que ficaram longe da tela.
  function liberar(div) {
    div.renderizacao?.cancel();
    div.replaceChildren();
    delete div.dataset.estado;
  }

  const observador = new IntersectionObserver(
    (entradas) => entradas.forEach((entrada) => (entrada.isIntersecting ? desenhar(entrada.target) : liberar(entrada.target))),
    { rootMargin: '150% 0px' },
  );
  const divsPaginas = [...paginas.querySelectorAll('.leitor-pagina')];
  divsPaginas.forEach((div) => observador.observe(div));
  aoSair(() => observador.disconnect());

  // Indica a página que está no meio da tela.
  let agendado = false;
  function atualizarPaginacao() {
    agendado = false;
    const meio = window.innerHeight / 2;
    const atual = divsPaginas.find((div) => div.getBoundingClientRect().bottom >= meio) ?? divsPaginas.at(-1);
    paginacao.textContent = `Página ${atual.dataset.pagina} de ${pdf.numPages}`;
  }
  const aoRolar = () => {
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(atualizarPaginacao);
    }
  };
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoSair(() => window.removeEventListener('scroll', aoRolar));
  atualizarPaginacao();

  const atualizarConcluido = () => render(fim.querySelector('[data-concluir]'), botaoConcluir(lerConcluidos().has(id)));
  atualizarConcluido();

  el.addEventListener('click', (evento) => {
    const botaoZoom = evento.target.closest('[data-zoom]');
    if (botaoZoom) {
      const novo = Math.min(ZOOMS.length - 1, Math.max(0, zoom + Number(botaoZoom.dataset.zoom)));
      if (novo === zoom) return;
      const pagina = paginacao.textContent.match(/\d+/)?.[0] ?? '1';
      zoom = novo;
      paginas.style.setProperty('--zoom', ZOOMS[zoom]);
      divsPaginas.forEach(liberar);
      // Recomeça a observação para redesenhar no novo tamanho e volta para a página que estava sendo lida.
      divsPaginas.forEach((div) => {
        observador.unobserve(div);
        observador.observe(div);
      });
      paginas.querySelector(`[data-pagina="${pagina}"]`)?.scrollIntoView({ block: 'start' });
      return;
    }

    if (evento.target.closest('[data-baixar]')) {
      salvarArquivo(arquivo.blob, arquivo.nome);
      return;
    }

    if (evento.target.closest('[data-concluir]')) {
      const concluido = alternarConcluido(id);
      atualizarConcluido();
      avisar(concluido ? 'Material marcado como concluído.' : 'Material desmarcado.');
    }
  });
}
