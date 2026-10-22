import { montarSeletorLocal } from '../components/seletor-local.js';
import { tipoVisita } from '../components/visita.js';
import { api } from '../core/api.js';
import { chaveDia } from '../core/formatos.js';
import { SITUACOES_VISITA, TIPOS_VISITA } from '../core/rotulos.js';
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

export default async function paginaFormularioVisita({ el, params, navegar, aoSair }) {
  const editando = Boolean(params.id);
  const [visita, igrejas] = await Promise.all([
    editando ? api.get(`/visitas/${params.id}`) : null,
    api.get('/igrejas/opcoes'),
  ]);

  if (editando && !visita.pode_editar) {
    render(el, blocoErro({ message: 'Você não tem permissão para editar esta visita.' }));
    return;
  }

  const hoje = chaveDia(new Date());
  const valores = visita ?? { tipo: 'evangelismo', situacao: 'realizada', data_visita: hoje, igreja_id: sessao.usuario.igreja_id };

  render(
    el,
    html`
      <form class="cartao" novalidate>
        <div class="alert alert-danger d-none" data-erro role="alert"></div>

        <fieldset class="mb-3">
          <legend class="form-label fs-6 mb-1">Onde foi a visita?</legend>
          <p class="small text-body-secondary mb-2">
            Marque a casa, a rua ou a quadra. Se estiver no local, toque em <i class="bi bi-crosshair" aria-label="usar minha localização"></i>.
          </p>
          <div data-seletor-local></div>
        </fieldset>

        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <label class="form-label" for="tipo">Tipo</label>
            <select class="form-select" id="tipo" name="tipo">
              ${Object.entries(TIPOS_VISITA).map(
                ([chave, { rotulo }]) => html`<option value="${chave}" ${valores.tipo === chave ? 'selected' : ''}>${rotulo}</option>`,
              )}
            </select>
          </div>
          <div class="col-sm-6">
            <label class="form-label" for="data_visita">Data</label>
            <input class="form-control" id="data_visita" name="data_visita" type="date" max="${hoje}" required
              value="${valores.data_visita}">
          </div>
        </div>

        <fieldset class="mb-3">
          <legend class="form-label fs-6">Como foi?</legend>
          <div class="opcoes-papel opcoes-tres">
            ${Object.entries(SITUACOES_VISITA).map(
              ([chave, { rotulo, icone }]) => html`
                <div class="opcao-papel">
                  <input type="radio" name="situacao" id="situacao-${chave}" value="${chave}" ${valores.situacao === chave ? 'checked' : ''}>
                  <label for="situacao-${chave}"><i class="bi bi-${icone}" aria-hidden="true"></i> ${rotulo}</label>
                </div>`,
            )}
          </div>
        </fieldset>

        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <label class="form-label" for="pessoas_alcancadas">Pessoas alcançadas <span class="text-body-secondary">(opcional)</span></label>
            <input class="form-control" id="pessoas_alcancadas" name="pessoas_alcancadas" type="number" inputmode="numeric"
              min="0" max="9999" step="1" value="${valores.pessoas_alcancadas ?? ''}">
            <div class="form-text">Quantas pessoas ouviram a mensagem ou foram atendidas.</div>
          </div>
          <div class="col-sm-6">
            <label class="form-label" for="igreja_id">Igreja <span class="text-body-secondary">(opcional)</span></label>
            <select class="form-select" id="igreja_id" name="igreja_id">${opcoesIgrejas(igrejas, valores.igreja_id)}</select>
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label" for="observacoes">Observações <span class="text-body-secondary">(opcional)</span></label>
          <textarea class="form-control" id="observacoes" name="observacoes" rows="3" maxlength="500"
            placeholder="Ex.: família receptiva, pediram oração; voltar no sábado à tarde.">${valores.observacoes ?? ''}</textarea>
          <div class="form-text aviso-privacidade">
            <i class="bi bi-shield-lock" aria-hidden="true"></i>
            Para proteger as famílias, não escreva nomes, telefones nem detalhes que identifiquem os moradores.
          </div>
        </div>

        <button class="btn btn-primary w-100" type="submit">${editando ? 'Salvar alterações' : 'Registrar visita'}</button>
      </form>`,
  );

  const form = el.querySelector('form');
  const seletorEl = el.querySelector('[data-seletor-local]');
  let seletor = null;
  try {
    seletor = await montarSeletorLocal(seletorEl, {
      latitude: valores.latitude ?? null,
      longitude: valores.longitude ?? null,
      simbolo: tipoVisita(valores.tipo).icone,
      ajuda: 'Toque no mapa para marcar o local da visita.',
      aoSair,
    });
  } catch (erro) {
    console.error(erro);
    render(seletorEl, html`<div class="alert alert-warning mb-0">O mapa não carregou. Verifique a internet e abra esta tela de novo.</div>`);
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    // O local é obrigatório: avisa antes de enviar, mostrando o mapa.
    if (!form.elements.namedItem('latitude')?.value) {
      seletorEl.querySelector('.mapa')?.classList.add('mapa-invalido');
      mostrarErroFormulario(form, { message: 'Marque no mapa o local da visita.' });
      seletorEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    seletorEl.querySelector('.mapa')?.classList.remove('mapa-invalido');

    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      const dados = lerFormulario(form);
      const salva = editando ? await api.put(`/visitas/${params.id}`, dados) : await api.post('/visitas', dados);
      avisar(editando ? 'Visita atualizada.' : 'Visita registrada no mapa!');
      navegar(`/visitas/${salva.id}`, { substituir: true });
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });

  // Ao trocar o tipo, o alfinete passa a mostrar o ícone correspondente.
  form.elements.namedItem('tipo').addEventListener('change', (evento) => {
    seletor?.trocarSimbolo(tipoVisita(evento.target.value).icone);
  });
}
