import { html } from '../core/ui.js';

/**
 * Mostra imagens em tela cheia, com setas (ou deslizar o dedo) para passar e botão de fechar.
 * imagens: [{ src, alt }]. aoFechar (opcional) roda quando a pessoa fecha.
 */
export function abrirVisualizador(imagens, inicial = 0, { aoFechar } = {}) {
  let atual = inicial;
  const focoAnterior = document.activeElement;
  const varias = imagens.length > 1;

  const fundo = document.createElement('div');
  fundo.className = 'visualizador';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.setAttribute('aria-label', 'Imagem ampliada');
  fundo.innerHTML = html`
    <button type="button" class="visualizador-botao visualizador-fechar" data-fechar aria-label="Fechar">
      <i class="bi bi-x-lg"></i>
    </button>
    ${varias
      ? html`<button type="button" class="visualizador-botao visualizador-anterior" data-passo="-1" aria-label="Imagem anterior">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button type="button" class="visualizador-botao visualizador-proxima" data-passo="1" aria-label="Próxima imagem">
            <i class="bi bi-chevron-right"></i>
          </button>`
      : ''}
    <img class="visualizador-imagem" alt="">
    <span class="visualizador-contador" aria-live="polite"></span>`.toString();

  const imagem = fundo.querySelector('img');
  const contador = fundo.querySelector('.visualizador-contador');

  function mostrar() {
    imagem.src = imagens[atual].src;
    imagem.alt = imagens[atual].alt ?? '';
    contador.textContent = varias ? `${atual + 1} de ${imagens.length}` : '';
  }
  const passar = (passo) => {
    atual = (atual + passo + imagens.length) % imagens.length;
    mostrar();
  };

  function fechar() {
    fundo.remove();
    document.removeEventListener('keydown', teclas);
    focoAnterior?.focus?.();
    aoFechar?.();
  }

  function teclas(evento) {
    if (evento.key === 'Escape') fechar();
    else if (varias && evento.key === 'ArrowLeft') passar(-1);
    else if (varias && evento.key === 'ArrowRight') passar(1);
  }

  fundo.addEventListener('click', (evento) => {
    if (evento.target === fundo || evento.target.closest('[data-fechar]')) return fechar();
    const botao = evento.target.closest('[data-passo]');
    if (botao) passar(Number(botao.dataset.passo));
  });

  // Deslizar o dedo para os lados também passa as imagens.
  let inicioToque = null;
  fundo.addEventListener('touchstart', (evento) => (inicioToque = evento.touches[0].clientX), { passive: true });
  fundo.addEventListener('touchend', (evento) => {
    if (inicioToque === null || !varias) return;
    const distancia = evento.changedTouches[0].clientX - inicioToque;
    if (Math.abs(distancia) > 50) passar(distancia < 0 ? 1 : -1);
    inicioToque = null;
  });

  document.addEventListener('keydown', teclas);
  document.body.append(fundo);
  mostrar();
  fundo.querySelector('[data-fechar]').focus();
  return fechar;
}
