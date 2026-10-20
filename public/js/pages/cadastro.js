import { api } from '../core/api.js';
import { BAIRROS_SUGERIDOS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import {
  alternarEnvio,
  avisar,
  html,
  lerFormulario,
  limparErrosFormulario,
  mostrarErroFormulario,
  opcoesIgrejas,
  render,
} from '../core/ui.js';

export default function paginaCadastro({ el, navegar }) {
  render(
    el,
    html`
      <div class="tela-acesso">
        <div class="cartao-acesso">
          <div class="text-center mb-4">
            <div class="logo-app"><i class="bi bi-person-plus" aria-hidden="true"></i></div>
            <h1 class="h4 fw-bold mb-1">Criar conta</h1>
            <p class="text-body-secondary mb-0">Faça parte da rede de igrejas e missionários</p>
          </div>

          <form novalidate>
            <div class="alert alert-danger d-none" data-erro role="alert"></div>

            <fieldset class="mb-3">
              <legend class="form-label fs-6">Eu sou</legend>
              <div class="opcoes-papel">
                <div class="opcao-papel">
                  <input type="radio" name="papel" id="papel-missionario" value="missionario" checked>
                  <label for="papel-missionario"><i class="bi bi-person-walking" aria-hidden="true"></i> Missionário</label>
                </div>
                <div class="opcao-papel">
                  <input type="radio" name="papel" id="papel-lider" value="lider">
                  <label for="papel-lider"><i class="bi bi-building" aria-hidden="true"></i> Líder de igreja</label>
                </div>
              </div>
            </fieldset>

            <div class="mb-3">
              <label class="form-label" for="nome">Nome completo</label>
              <input class="form-control" id="nome" name="nome" autocomplete="name" required>
            </div>
            <div class="mb-3">
              <label class="form-label" for="email">E-mail</label>
              <input class="form-control" id="email" name="email" type="email" inputmode="email" autocomplete="email" required>
            </div>
            <div class="mb-3">
              <label class="form-label" for="telefone">Telefone / WhatsApp <span class="text-body-secondary">(opcional)</span></label>
              <input class="form-control" id="telefone" name="telefone" type="tel" inputmode="tel" autocomplete="tel"
                placeholder="(98) 99999-0000">
            </div>
            <div class="mb-3">
              <label class="form-label" for="igreja_id">Igreja <span class="text-body-secondary">(opcional)</span></label>
              <select class="form-select" id="igreja_id" name="igreja_id" data-igrejas>
                <option value="">Carregando igrejas...</option>
              </select>
              <div class="form-text">Líderes podem cadastrar a própria igreja depois de entrar.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="bairro_atuacao">Bairro de atuação <span class="text-body-secondary">(opcional)</span></label>
              <input class="form-control" id="bairro_atuacao" name="bairro_atuacao" list="bairros" autocomplete="off">
              <datalist id="bairros">${BAIRROS_SUGERIDOS.map((bairro) => html`<option value="${bairro}"></option>`)}</datalist>
            </div>
            <div class="mb-3">
              <label class="form-label" for="senha">Senha</label>
              <input class="form-control" id="senha" name="senha" type="password" autocomplete="new-password" required
                aria-describedby="ajuda-senha">
              <div class="form-text" id="ajuda-senha">Mínimo de 8 caracteres.</div>
            </div>
            <div class="mb-2">
              <label class="form-label" for="confirmar_senha">Confirmar senha</label>
              <input class="form-control" id="confirmar_senha" name="confirmar_senha" type="password" autocomplete="new-password" required>
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="mostrar-senha">
              <label class="form-check-label small" for="mostrar-senha">Mostrar senhas</label>
            </div>
            <div class="form-check mb-4">
              <input class="form-check-input" type="checkbox" id="aceite" name="aceite">
              <label class="form-check-label small" for="aceite">
                Li e aceito o <a href="#/privacidade" target="_blank" rel="noopener">aviso de privacidade</a>.
              </label>
            </div>

            <button class="btn btn-primary btn-lg w-100" type="submit">Criar conta</button>
          </form>

          <p class="text-center mt-4 mb-0">Já tem conta? <a href="#/login" class="fw-semibold">Entrar</a></p>
        </div>
      </div>`,
  );

  const form = el.querySelector('form');
  const seletorIgrejas = el.querySelector('[data-igrejas]');

  api
    .get('/igrejas/opcoes')
    .then((igrejas) => render(seletorIgrejas, opcoesIgrejas(igrejas, null, 'Ainda não faço parte de uma igreja cadastrada')))
    .catch(() => render(seletorIgrejas, opcoesIgrejas([], null, 'Não foi possível carregar as igrejas')));

  el.querySelector('#mostrar-senha').addEventListener('change', (evento) => {
    const tipo = evento.target.checked ? 'text' : 'password';
    form.elements.senha.type = tipo;
    form.elements.confirmar_senha.type = tipo;
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const { confirmar_senha: confirmacao, ...dados } = lerFormulario(form);

    if (dados.senha !== confirmacao) {
      mostrarErroFormulario(form, {
        message: 'As senhas não conferem.',
        detalhes: [{ campo: 'confirmar_senha', mensagem: 'As senhas não conferem.' }],
      });
      return;
    }

    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      const { token, usuario } = await api.post('/auth/registrar', dados);
      sessao.iniciar(token, usuario);
      avisar(`Bem-vindo(a), ${usuario.nome.split(' ')[0]}!`);
      navegar('/inicio');
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}
