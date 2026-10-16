import { api } from '../core/api.js';
import { BAIRROS_SUGERIDOS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import {
  alternarEnvio,
  avisar,
  blocoErro,
  html,
  lerFormulario,
  limparErrosFormulario,
  mostrarErroFormulario,
  render,
} from '../core/ui.js';

export default async function paginaFormularioIgreja({ el, params, navegar }) {
  const editando = Boolean(params.id);
  const igreja = editando ? await api.get(`/igrejas/${params.id}`) : null;

  if (editando && !igreja.pode_editar) {
    render(el, blocoErro({ message: 'Você não tem permissão para editar esta igreja.' }));
    return;
  }
  if (!editando && sessao.usuario.papel === 'missionario') {
    render(el, blocoErro({ message: 'Apenas líderes e administradores podem cadastrar igrejas.' }));
    return;
  }

  const valores = igreja ?? { cidade: 'São Luís' };

  render(
    el,
    html`
      <form class="cartao" novalidate>
        <div class="alert alert-danger d-none" data-erro role="alert"></div>

        <div class="mb-3">
          <label class="form-label" for="nome">Nome da igreja</label>
          <input class="form-control" id="nome" name="nome" maxlength="120" required value="${valores.nome ?? ''}">
        </div>
        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <label class="form-label" for="bairro">Bairro</label>
            <input class="form-control" id="bairro" name="bairro" maxlength="80" list="bairros" required
              value="${valores.bairro ?? ''}">
            <datalist id="bairros">${BAIRROS_SUGERIDOS.map((bairro) => html`<option value="${bairro}"></option>`)}</datalist>
          </div>
          <div class="col-sm-6">
            <label class="form-label" for="cidade">Cidade</label>
            <input class="form-control" id="cidade" name="cidade" maxlength="80" required value="${valores.cidade ?? ''}">
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label" for="endereco">Endereço <span class="text-body-secondary">(opcional)</span></label>
          <input class="form-control" id="endereco" name="endereco" maxlength="200" value="${valores.endereco ?? ''}">
        </div>
        <div class="row g-3 mb-4">
          <div class="col-sm-6">
            <label class="form-label" for="telefone">Telefone <span class="text-body-secondary">(opcional)</span></label>
            <input class="form-control" id="telefone" name="telefone" type="tel" inputmode="tel" value="${valores.telefone ?? ''}"
              placeholder="(98) 3222-0000">
          </div>
          <div class="col-sm-6">
            <label class="form-label" for="email">E-mail <span class="text-body-secondary">(opcional)</span></label>
            <input class="form-control" id="email" name="email" type="email" inputmode="email" value="${valores.email ?? ''}">
          </div>
        </div>

        <button class="btn btn-primary w-100" type="submit">${editando ? 'Salvar alterações' : 'Cadastrar igreja'}</button>
      </form>`,
  );

  const form = el.querySelector('form');
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      const dados = lerFormulario(form);
      const salva = editando ? await api.put(`/igrejas/${params.id}`, dados) : await api.post('/igrejas', dados);

      // Ao cadastrar a primeira igreja, o líder passa a fazer parte dela; atualiza os dados guardados.
      if (!editando && !sessao.usuario.igreja_id) sessao.atualizarUsuario(await api.get('/auth/eu'));

      avisar(editando ? 'Igreja atualizada.' : 'Igreja cadastrada!');
      navegar(`/igrejas/${salva.id}`, { substituir: true });
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}
