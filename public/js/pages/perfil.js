import { api } from '../core/api.js';
import { instalar, podeInstalar } from '../core/pwa.js';
import { BAIRROS_SUGERIDOS, PAPEIS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import {
  alternarEnvio,
  avatar,
  avisar,
  confirmar,
  html,
  lerFormulario,
  limparErrosFormulario,
  mostrarErroFormulario,
  opcoesIgrejas,
  render,
} from '../core/ui.js';

/** Envia o formulário mostrando carregamento no botão e erros nos campos. */
function aoEnviar(form, acao) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      await acao(lerFormulario(form));
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}

export default async function paginaPerfil({ el, navegar }) {
  const [eu, igrejas] = await Promise.all([api.get('/auth/eu'), api.get('/igrejas/opcoes')]);
  sessao.atualizarUsuario(eu);

  render(
    el,
    html`
      <section class="cartao text-center mb-3">
        ${avatar(eu.nome, 'lg')}
        <h1 class="h5 fw-bold mt-3 mb-1" data-nome>${eu.nome}</h1>
        <div class="small text-body-secondary text-break">${eu.email}</div>
        <span class="badge rounded-pill papel-${eu.papel} mt-2">${PAPEIS[eu.papel]}</span>
      </section>

      <form class="cartao mb-3" data-form="perfil" novalidate>
        <h2 class="h6 fw-bold mb-3">Meus dados</h2>
        <div class="alert alert-danger d-none" data-erro role="alert"></div>
        <div class="mb-3">
          <label class="form-label" for="nome">Nome completo</label>
          <input class="form-control" id="nome" name="nome" maxlength="120" autocomplete="name" value="${eu.nome}">
        </div>
        <div class="mb-3">
          <label class="form-label" for="telefone">Telefone / WhatsApp</label>
          <input class="form-control" id="telefone" name="telefone" type="tel" inputmode="tel" autocomplete="tel"
            value="${eu.telefone ?? ''}" placeholder="(98) 99999-0000">
        </div>
        <div class="mb-3">
          <label class="form-label" for="igreja_id">Igreja</label>
          <select class="form-select" id="igreja_id" name="igreja_id">${opcoesIgrejas(igrejas, eu.igreja_id)}</select>
        </div>
        <div class="mb-3">
          <label class="form-label" for="bairro_atuacao">Bairro de atuação</label>
          <input class="form-control" id="bairro_atuacao" name="bairro_atuacao" maxlength="80" list="bairros"
            value="${eu.bairro_atuacao ?? ''}">
          <datalist id="bairros">${BAIRROS_SUGERIDOS.map((bairro) => html`<option value="${bairro}"></option>`)}</datalist>
        </div>
        <div class="mb-3">
          <label class="form-label" for="sobre">Sobre mim</label>
          <textarea class="form-control" id="sobre" name="sobre" rows="3" maxlength="500"
            placeholder="Conte um pouco sobre seu trabalho ou ministério">${eu.sobre ?? ''}</textarea>
        </div>
        <button class="btn btn-primary w-100" type="submit">Salvar alterações</button>
      </form>

      <form class="cartao mb-3" data-form="senha" novalidate>
        <h2 class="h6 fw-bold mb-3">Alterar senha</h2>
        <div class="alert alert-danger d-none" data-erro role="alert"></div>
        <div class="mb-3">
          <label class="form-label" for="senha_atual">Senha atual</label>
          <input class="form-control" id="senha_atual" name="senha_atual" type="password" autocomplete="current-password">
        </div>
        <div class="mb-3">
          <label class="form-label" for="nova_senha">Nova senha</label>
          <input class="form-control" id="nova_senha" name="nova_senha" type="password" autocomplete="new-password">
          <div class="form-text">Mínimo de 8 caracteres.</div>
        </div>
        <div class="mb-3">
          <label class="form-label" for="confirmar_senha">Confirmar nova senha</label>
          <input class="form-control" id="confirmar_senha" name="confirmar_senha" type="password" autocomplete="new-password">
        </div>
        <button class="btn btn-outline-primary w-100" type="submit">Alterar senha</button>
      </form>

      ${podeInstalar()
        ? html`<button type="button" class="btn btn-outline-primary w-100 mb-3" data-acao="instalar">
            <i class="bi bi-phone" aria-hidden="true"></i> Instalar aplicativo no celular
          </button>`
        : ''}
      <button type="button" class="btn btn-outline-danger w-100" data-acao="sair">
        <i class="bi bi-box-arrow-right" aria-hidden="true"></i> Sair da conta
      </button>

      <p class="text-center small text-body-secondary mt-4 mb-0">
        Projeto Missionário · versão 0.2.0<br>
        <a href="#/privacidade">Aviso de privacidade</a>
      </p>`,
  );

  aoEnviar(el.querySelector('[data-form="perfil"]'), async (dados) => {
    const atualizado = await api.put('/usuarios/eu', dados);
    sessao.atualizarUsuario(atualizado);
    el.querySelector('[data-nome]').textContent = atualizado.nome;
    avisar('Perfil atualizado.');
  });

  const formSenha = el.querySelector('[data-form="senha"]');
  aoEnviar(formSenha, async ({ confirmar_senha: confirmacao, ...dados }) => {
    if (dados.nova_senha !== confirmacao) {
      const mensagem = 'As senhas não conferem.';
      throw Object.assign(new Error(mensagem), { detalhes: [{ campo: 'confirmar_senha', mensagem }] });
    }
    await api.put('/usuarios/eu/senha', dados);
    formSenha.reset();
    avisar('Senha alterada.');
  });

  const botaoInstalar = el.querySelector('[data-acao="instalar"]');
  botaoInstalar?.addEventListener('click', async () => {
    if (await instalar()) avisar('Aplicativo instalado!');
    botaoInstalar.remove();
  });

  el.querySelector('[data-acao="sair"]').addEventListener('click', async () => {
    if (!(await confirmar({ titulo: 'Sair', mensagem: 'Deseja sair da sua conta neste aparelho?', botao: 'Sair', perigo: false }))) return;
    sessao.encerrar();
    navegar('/login');
  });
}
