import { api } from '../core/api.js';
import { atualizarSeloAgenda } from '../core/layout.js';
import { paraCampoDataHora } from '../core/formatos.js';
import { TIPOS_EVENTO } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import {
  alternarEnvio,
  avisar,
  blocoErro,
  html,
  lerFormulario,
  limparErrosFormulario,
  mostrarErroFormulario,
  opcoesIgrejas,
  render,
} from '../core/ui.js';

export default async function paginaFormularioEvento({ el, params, navegar }) {
  const editando = Boolean(params.id);
  const [evento, igrejas] = await Promise.all([
    editando ? api.get(`/eventos/${params.id}`) : null,
    api.get('/igrejas/opcoes'),
  ]);

  if (editando && !evento.pode_editar) {
    render(el, blocoErro({ message: 'Você não tem permissão para editar este evento.' }));
    return;
  }

  const valores = evento ?? { tipo: 'visita', igreja_id: sessao.usuario.igreja_id };

  render(
    el,
    html`
      <form class="cartao" novalidate>
        <div class="alert alert-danger d-none" data-erro role="alert"></div>

        <div class="mb-3">
          <label class="form-label" for="titulo">Título</label>
          <input class="form-control" id="titulo" name="titulo" maxlength="120" required value="${valores.titulo ?? ''}"
            placeholder="Ex.: Visita às famílias da Rua 10">
        </div>

        <div class="mb-3">
          <label class="form-label" for="tipo">Tipo</label>
          <select class="form-select" id="tipo" name="tipo">
            ${Object.entries(TIPOS_EVENTO).map(
              ([chave, { rotulo }]) =>
                html`<option value="${chave}" ${valores.tipo === chave ? 'selected' : ''}>${rotulo}</option>`,
            )}
          </select>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <label class="form-label" for="data_inicio">Início</label>
            <input class="form-control" id="data_inicio" name="data_inicio" type="datetime-local" required
              value="${paraCampoDataHora(valores.data_inicio)}">
          </div>
          <div class="col-sm-6">
            <label class="form-label" for="data_fim">Término <span class="text-body-secondary">(opcional)</span></label>
            <input class="form-control" id="data_fim" name="data_fim" type="datetime-local"
              value="${paraCampoDataHora(valores.data_fim)}">
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label" for="local">Local <span class="text-body-secondary">(opcional)</span></label>
          <input class="form-control" id="local" name="local" maxlength="200" value="${valores.local ?? ''}"
            placeholder="Endereço ou ponto de referência">
        </div>

        <div class="mb-3">
          <label class="form-label" for="igreja_id">Igreja <span class="text-body-secondary">(opcional)</span></label>
          <select class="form-select" id="igreja_id" name="igreja_id">
            ${opcoesIgrejas(igrejas, valores.igreja_id, 'Nenhuma (atividade geral)')}
          </select>
        </div>

        <div class="mb-4">
          <label class="form-label" for="descricao">Descrição <span class="text-body-secondary">(opcional)</span></label>
          <textarea class="form-control" id="descricao" name="descricao" rows="4" maxlength="2000"
            placeholder="Detalhes, o que levar, quem participa...">${valores.descricao ?? ''}</textarea>
        </div>

        <button class="btn btn-primary w-100" type="submit">${editando ? 'Salvar alterações' : 'Agendar atividade'}</button>
      </form>`,
  );

  const form = el.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErrosFormulario(form);
    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      const dados = lerFormulario(form);
      const salvo = editando ? await api.put(`/eventos/${params.id}`, dados) : await api.post('/eventos', dados);
      avisar(editando ? 'Evento atualizado.' : 'Atividade agendada!');
      atualizarSeloAgenda();
      navegar(`/agenda/${salvo.id}`, { substituir: true });
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}
