import { api } from '../core/api.js';
import { sessao } from '../core/sessao.js';
import { alternarEnvio, html, lerFormulario, limparErrosFormulario, mostrarErroFormulario, render } from '../core/ui.js';

export default function paginaLogin({ el, navegar }) {
  render(
    el,
    html`
      <div class="tela-acesso">
        <div class="cartao-acesso">
          <div class="text-center mb-4">
            <img class="logo-app" src="/icons/icon.svg" alt="" width="76" height="76">
            <h1 class="h3 fw-bold mb-1">Projeto Missionário</h1>
            <p class="text-body-secondary mb-0">Conectando igrejas e missionários</p>
          </div>

          <form novalidate>
            <div class="alert alert-danger d-none" data-erro role="alert"></div>
            <div class="mb-3">
              <label class="form-label" for="email">E-mail</label>
              <input class="form-control form-control-lg" id="email" name="email" type="email" inputmode="email"
                autocomplete="email" placeholder="seu@email.com" required>
            </div>
            <div class="mb-2">
              <label class="form-label" for="senha">Senha</label>
              <input class="form-control form-control-lg" id="senha" name="senha" type="password"
                autocomplete="current-password" placeholder="Sua senha" required>
            </div>
            <div class="form-check mb-4">
              <input class="form-check-input" type="checkbox" id="mostrar-senha">
              <label class="form-check-label small" for="mostrar-senha">Mostrar senha</label>
            </div>
            <button class="btn btn-primary btn-lg w-100" type="submit">Entrar</button>
          </form>

          <p class="text-center mt-4 mb-0">
            Ainda não tem conta? <a href="#/cadastro" class="fw-semibold">Criar conta</a>
          </p>
        </div>
      </div>`,
  );

  const form = el.querySelector('form');
  el.querySelector('#mostrar-senha').addEventListener('change', (evento) => {
    form.elements.senha.type = evento.target.checked ? 'text' : 'password';
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      const { token, usuario } = await api.post('/auth/login', lerFormulario(form));
      sessao.iniciar(token, usuario);
      navegar('/inicio');
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}
