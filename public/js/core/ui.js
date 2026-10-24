const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escaparHtml = (texto) => String(texto).replace(/[&<>"']/g, (caractere) => ESCAPES[caractere]);

class HtmlSeguro {
  constructor(conteudo) {
    this.conteudo = conteudo;
  }

  toString() {
    return this.conteudo;
  }
}

function paraHtml(valor) {
  if (valor === null || valor === undefined || valor === false) return '';
  if (valor instanceof HtmlSeguro) return valor.conteudo;
  if (Array.isArray(valor)) return valor.map(paraHtml).join('');
  return escaparHtml(valor);
}

/**
 * Monta HTML com segurança: todo valor interpolado é escapado (proteção contra XSS),
 * exceto outros trechos criados com html``.
 */
export function html(partes, ...valores) {
  let resultado = partes[0];
  valores.forEach((valor, i) => {
    resultado += paraHtml(valor) + partes[i + 1];
  });
  return new HtmlSeguro(resultado);
}

export function render(elemento, conteudo) {
  elemento.innerHTML = paraHtml(conteudo);
}

/** Acrescenta conteúdo sem redesenhar o que já está na tela ("afterbegin" coloca no início). */
export function acrescentar(elemento, conteudo, posicao = 'beforeend') {
  elemento.insertAdjacentHTML(posicao, paraHtml(conteudo));
}

export const carregando = () => html`
  <div class="carregando" role="status">
    <div class="spinner-border text-primary" aria-hidden="true"></div>
    <span class="visually-hidden">Carregando...</span>
  </div>`;

export const estadoVazio = ({ icone = 'inbox', titulo, texto, acao }) => html`
  <div class="estado-vazio">
    <i class="bi bi-${icone}" aria-hidden="true"></i>
    <p class="fw-semibold mb-1">${titulo}</p>
    ${texto ? html`<p class="small mb-3">${texto}</p>` : ''}
    ${acao ? html`<a class="btn btn-primary btn-sm" href="${acao.href}">${acao.rotulo}</a>` : ''}
  </div>`;

export const blocoErro = (erro) => html`
  <div class="alert alert-danger d-flex gap-2 align-items-start" role="alert">
    <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
    <div>${erro?.message || 'Algo deu errado. Tente novamente.'}</div>
  </div>`;

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const ultima = partes.length > 1 ? partes.at(-1)[0] : '';
  return (partes[0][0] + ultima).toUpperCase();
}

const QUANTIDADE_CORES_AVATAR = 6;

function corDoNome(nome = '') {
  let soma = 0;
  for (const caractere of nome) soma += caractere.codePointAt(0);
  return soma % QUANTIDADE_CORES_AVATAR;
}

export const avatar = (nome, tamanho = '') => html`
  <span class="avatar ${tamanho ? `avatar-${tamanho}` : ''} avatar-cor-${corDoNome(nome)}" aria-hidden="true">${iniciais(nome)}</span>`;

export const opcoesIgrejas = (igrejas, selecionada, rotuloVazio = 'Nenhuma') => html`
  <option value="">${rotuloVazio}</option>
  ${igrejas.map(
    (igreja) =>
      html`<option value="${igreja.id}" ${igreja.id === selecionada ? 'selected' : ''}>${igreja.nome} (${igreja.bairro})</option>`,
  )}`;

const CORES_AVISO = { sucesso: 'text-bg-success', erro: 'text-bg-danger', info: 'text-bg-dark' };

/** Mensagem rápida no topo da tela (toast). */
export function avisar(mensagem, tipo = 'sucesso') {
  const elemento = document.createElement('div');
  elemento.className = `toast align-items-center border-0 ${CORES_AVISO[tipo] ?? CORES_AVISO.info}`;
  elemento.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  render(
    elemento,
    html`<div class="d-flex">
      <div class="toast-body">${mensagem}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>`,
  );
  document.getElementById('avisos').append(elemento);
  elemento.addEventListener('hidden.bs.toast', () => elemento.remove());
  new window.bootstrap.Toast(elemento, { delay: 3500 }).show();
}

/** Janela de confirmação. Resolve true se a pessoa confirmar. */
export function confirmar({ titulo = 'Confirmar', mensagem, botao = 'Confirmar', perigo = true }) {
  return new Promise((resolve) => {
    const elemento = document.createElement('div');
    elemento.className = 'modal fade';
    elemento.tabIndex = -1;
    elemento.setAttribute('aria-hidden', 'true');
    render(
      elemento,
      html`<div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title fs-5">${titulo}</h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">${mensagem}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" data-confirmar disabled>${botao}</button>
          </div>
        </div>
      </div>`,
    );
    document.body.append(elemento);

    const modal = new window.bootstrap.Modal(elemento);
    const botaoConfirmar = elemento.querySelector('[data-confirmar]');
    let confirmado = false;

    // Durante a animação de abertura o Bootstrap ignora hide(); liberar o botão antes disso
    // permitiria marcar "confirmado" e, em seguida, a pessoa cancelar e a ação ser executada mesmo assim.
    elemento.addEventListener('shown.bs.modal', () => {
      botaoConfirmar.disabled = false;
      botaoConfirmar.focus();
    });
    botaoConfirmar.addEventListener('click', () => {
      confirmado = true;
      modal.hide();
    });
    elemento.addEventListener('hidden.bs.modal', () => {
      modal.dispose();
      elemento.remove();
      resolve(confirmado);
    });
    modal.show();
  });
}

export const lerFormulario = (form) => Object.fromEntries(new FormData(form));

export function limparErrosFormulario(form) {
  form.querySelectorAll('.is-invalid').forEach((campo) => campo.classList.remove('is-invalid'));
  form.querySelectorAll('.invalid-feedback[data-gerado]').forEach((elemento) => elemento.remove());
  const alerta = form.querySelector('[data-erro]');
  if (alerta) {
    alerta.textContent = '';
    alerta.classList.add('d-none');
  }
}

/** Mostra o erro da API: ao lado de cada campo inválido ou, se não houver campo, no alerta do formulário. */
export function mostrarErroFormulario(form, erro) {
  limparErrosFormulario(form);
  let primeiroCampo = null;
  const mensagensGerais = [];

  for (const { campo, mensagem } of erro.detalhes ?? []) {
    const elemento = form.elements.namedItem(campo);
    // Campos ocultos (ex.: coordenadas do mapa) não têm onde exibir a mensagem: ela vai para o alerta.
    if (elemento instanceof HTMLInputElement && elemento.type === 'hidden') {
      if (!mensagensGerais.includes(mensagem)) mensagensGerais.push(mensagem);
      continue;
    }
    if (!(elemento instanceof HTMLElement) || elemento.classList.contains('is-invalid')) continue;

    elemento.classList.add('is-invalid');
    const retorno = document.createElement('div');
    retorno.className = 'invalid-feedback';
    retorno.dataset.gerado = '';
    retorno.textContent = mensagem;
    // Em caixas de seleção, a mensagem vai depois do rótulo, como o Bootstrap espera.
    const grupoCheckbox = elemento.type === 'checkbox' ? elemento.closest('.form-check') : null;
    if (grupoCheckbox) grupoCheckbox.append(retorno);
    else elemento.insertAdjacentElement('afterend', retorno);
    primeiroCampo ??= elemento;
  }

  if (!primeiroCampo && !mensagensGerais.length) mensagensGerais.push(erro.message);
  if (mensagensGerais.length) {
    const alerta = form.querySelector('[data-erro]');
    if (!alerta) {
      avisar(mensagensGerais.join(' '), 'erro');
    } else {
      alerta.textContent = mensagensGerais.join(' ');
      alerta.classList.remove('d-none');
      if (!primeiroCampo) alerta.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  primeiroCampo?.focus();
}

export function alternarEnvio(botao, enviando, texto = 'Enviando...') {
  if (enviando) {
    botao.dataset.conteudoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${escaparHtml(texto)}`;
    return;
  }
  botao.disabled = false;
  if (botao.dataset.conteudoOriginal) botao.innerHTML = botao.dataset.conteudoOriginal;
}

/** Executa a função só depois que a pessoa para de digitar. */
export function atrasar(funcao, milissegundos = 300) {
  let temporizador;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcao(...argumentos), milissegundos);
  };
}
