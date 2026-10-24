import { estaInstalado, instalar, podeInstalar, sistemaDoCelular } from '../core/pwa.js';
import { sessao } from '../core/sessao.js';
import { avisar, html, render } from '../core/ui.js';

// Botão desenhado como o do celular, para a pessoa reconhecer onde tocar.
const botao = (icone, texto = '') =>
  html`<span class="botao-exemplo">${icone ? html`<i class="bi bi-${icone}" aria-hidden="true"></i>` : ''}${texto}</span>`;

// Os nomes dos botões são os que aparecem nos celulares em português.
const PASSOS = {
  iphone: [
    {
      texto: html`Abra este endereço no ${botao('browser-safari', 'Safari')}, o navegador da bússola.`,
      dica: 'Se o link abriu dentro de outro app, como o Instagram, procure a opção de abrir no Safari.',
    },
    {
      texto: html`Toque em ${botao('box-arrow-up', 'Compartilhar')}, na barra de baixo (no iPad, fica em cima).`,
      dica: html`Não está aparecendo? Toque antes nos três pontinhos ${botao('three-dots')} ao lado do endereço.`,
    },
    {
      texto: html`Role as opções e toque em ${botao('plus-square', 'Adicionar à Tela de Início')}.`,
      dica: 'Não achou? Vá até o fim da lista ou toque em Ver Mais.',
    },
    {
      texto: html`Toque em ${botao(null, 'Adicionar')}, no canto de cima.`,
      dica: 'Se aparecer a opção de abrir como app, deixe ligada.',
    },
  ],
  android: [
    {
      texto: html`Abra este endereço no ${botao('browser-chrome', 'Chrome')}.`,
      dica: 'Abriu pelo WhatsApp? Toque nos três pontinhos e escolha Abrir no Chrome.',
    },
    {
      texto: html`Toque nos três pontinhos ${botao('three-dots-vertical')}, no canto de cima, à direita.`,
    },
    {
      texto: html`Toque em ${botao(null, 'Instalar app')}.`,
      dica: 'Em alguns celulares, o nome é Adicionar à tela inicial.',
    },
    {
      texto: html`Confirme em ${botao(null, 'Instalar')}.`,
    },
  ],
};

const DEPOIS = {
  iphone: 'No iPhone, o app instalado não usa o login do Safari: na primeira vez, entre de novo com seu e-mail e senha.',
  android: 'O app também aparece na lista de aplicativos do celular, junto com os outros.',
};

/**
 * Passo a passo para instalar o app na tela inicial do iPhone ou do Android.
 * Abre com ou sem login, para a liderança poder mandar o link a quem ainda não tem conta.
 */
export default function paginaInstalar({ el, aoSair }) {
  const doCelular = sistemaDoCelular();
  let sistema = doCelular ?? 'android';
  const convite = `Instale o Projeto Missionário no seu celular. É só seguir o passo a passo: ${window.location.origin}/#/instalar`;

  render(
    el,
    html`
      <div class="tela-acesso">
        <article class="cartao-acesso tutorial-instalar">
          <img class="logo-app" src="/icons/icon.svg" alt="" width="76" height="76">
          <h1 class="h4 fw-bold text-center mb-1">Instale o app no celular</h1>
          <p class="text-center text-body-secondary small mb-3">
            Ele fica na tela inicial, como os outros aplicativos, e abre mais rápido. Leva menos de um minuto.
          </p>
          ${estaInstalado()
            ? html`<p class="aviso-instalacao instalado">
                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                <span>O app já está instalado neste aparelho. Para ensinar alguém, compartilhe este passo a passo.</span>
              </p>`
            : ''}
          ${doCelular
            ? ''
            : html`<p class="aviso-instalacao">
                <i class="bi bi-laptop" aria-hidden="true"></i>
                <span>Você está no computador. Abra este endereço no celular para instalar, ou compartilhe o passo a passo.</span>
              </p>`}

          <div class="text-center">
            <div class="alternador" role="group" aria-label="Escolha o tipo de celular">
              <button type="button" class="alternador-opcao" data-sistema="iphone">
                <i class="bi bi-apple" aria-hidden="true"></i> iPhone
              </button>
              <button type="button" class="alternador-opcao" data-sistema="android">
                <i class="bi bi-android2" aria-hidden="true"></i> Android
              </button>
            </div>
          </div>

          <div data-passos></div>

          <a class="btn btn-success w-100 mt-4" href="https://wa.me/?text=${encodeURIComponent(convite)}" target="_blank" rel="noopener">
            <i class="bi bi-whatsapp" aria-hidden="true"></i> Enviar pelo WhatsApp
          </a>
          <a class="btn btn-light w-100 mt-2" href="${sessao.logado ? '#/inicio' : '#/login'}">
            ${sessao.logado ? 'Voltar para o app' : 'Entrar no app'}
          </a>
        </article>
      </div>`,
  );

  function desenharPassos() {
    el.querySelectorAll('[data-sistema]').forEach((opcao) => {
      opcao.setAttribute('aria-pressed', String(opcao.dataset.sistema === sistema));
    });
    // No Android, o Chrome às vezes permite instalar com um toque, sem passar pelo menu.
    const umToque = sistema === 'android' && doCelular === 'android' && podeInstalar();

    render(
      el.querySelector('[data-passos]'),
      html`
        ${umToque
          ? html`<div class="instalar-rapido">
              <p class="fw-semibold mb-2">Seu celular permite instalar com um toque.</p>
              <button type="button" class="btn btn-primary w-100" data-acao="instalar">
                <i class="bi bi-download" aria-hidden="true"></i> Instalar agora
              </button>
              <p class="small text-body-secondary mt-2 mb-0">Ou siga os passos abaixo.</p>
            </div>`
          : ''}
        <ol class="passos-instalar">
          ${PASSOS[sistema].map(
            (passo) => html`<li>${passo.texto}${passo.dica ? html`<span class="passo-dica">${passo.dica}</span>` : ''}</li>`,
          )}
        </ol>
        <div class="instalar-pronto">
          <span class="icone-tela-inicial">
            <img src="/icons/icon-192.png" alt="" width="56" height="56">
            <span>Missionário</span>
          </span>
          <p class="mb-0"><strong>Pronto!</strong> Procure este ícone na tela inicial e abra o app por ele.</p>
        </div>
        <p class="dica-depois"><i class="bi bi-info-circle" aria-hidden="true"></i> <span>${DEPOIS[sistema]}</span></p>`,
    );
  }

  el.querySelector('.alternador').addEventListener('click', (evento) => {
    const opcao = evento.target.closest('[data-sistema]');
    if (!opcao) return;
    sistema = opcao.dataset.sistema;
    desenharPassos();
  });

  el.querySelector('[data-passos]').addEventListener('click', async (evento) => {
    if (!evento.target.closest('[data-acao="instalar"]')) return;
    if (await instalar()) avisar('Aplicativo instalado! Procure o ícone na tela inicial.');
    // O pedido de instalação só pode ser usado uma vez: o atalho some.
    desenharPassos();
  });

  // O Chrome pode liberar a instalação com um toque só depois que a página abriu.
  window.addEventListener('beforeinstallprompt', desenharPassos);
  aoSair(() => window.removeEventListener('beforeinstallprompt', desenharPassos));

  desenharPassos();
}
