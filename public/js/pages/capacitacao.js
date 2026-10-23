import { api } from '../core/api.js';
import { baixarPdf } from '../core/arquivos.js';
import { guardarTrilha, lerConcluidos, salvarConcluidos } from '../core/progresso.js';
import { TIPOS_MATERIAL } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import { alternarEnvio, avisar, confirmar, estadoVazio, html, render } from '../core/ui.js';

function agruparPorEtapa(materiais) {
  const grupos = new Map();
  for (const material of materiais) {
    if (!grupos.has(material.etapa)) grupos.set(material.etapa, []);
    grupos.get(material.etapa).push(material);
  }
  return grupos;
}

// PDFs abrem no leitor do próprio app; vídeos e sites abrem em uma nova aba.
function linkPrincipal(material) {
  return material.tipo === 'pdf'
    ? html`href="#/capacitacao/${material.id}/ler"`
    : html`href="${material.url}" target="_blank" rel="noopener"`;
}

function itemMaterial(material, concluido) {
  const tipo = TIPOS_MATERIAL[material.tipo] ?? TIPOS_MATERIAL.link;
  return html`
    <article class="item-material ${concluido ? 'concluido' : ''}">
      <span class="icone-quadrado tipo-material-${material.tipo}"><i class="bi bi-${tipo.icone}" aria-hidden="true"></i></span>
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex align-items-start gap-2">
          <a class="item-material-titulo flex-grow-1" ${linkPrincipal(material)}>${material.titulo}</a>
          ${material.pode_excluir
            ? html`<button type="button" class="btn-icone btn-icone-sm" data-excluir="${material.id}" aria-label="Excluir material">
                <i class="bi bi-trash3"></i>
              </button>`
            : ''}
        </div>
        ${material.descricao ? html`<p class="item-material-descricao">${material.descricao}</p>` : ''}
        <div class="acoes-material">
          <a class="btn btn-primary btn-sm" ${linkPrincipal(material)}>
            <i class="bi bi-${tipo.iconeAcao}" aria-hidden="true"></i> ${tipo.acao}
          </a>
          ${material.tipo === 'pdf'
            ? html`<button type="button" class="btn btn-outline-primary btn-sm" data-baixar="${material.id}">
                <i class="bi bi-download" aria-hidden="true"></i> Baixar
              </button>`
            : ''}
        </div>
        <div class="form-check mt-2 mb-0">
          <input class="form-check-input" type="checkbox" id="concluido-${material.id}" data-concluir="${material.id}"
            ${concluido ? 'checked' : ''}>
          <label class="form-check-label small" for="concluido-${material.id}">Concluí este material</label>
        </div>
      </div>
    </article>`;
}

export default async function paginaCapacitacao({ el }) {
  const podeAdicionar = sessao.usuario.papel !== 'missionario';
  // Os documentos reservados ficam à parte da trilha pública, só para quem é de uma igreja.
  const temIgreja = Boolean(sessao.usuario.igreja_id);
  let materiais = await api.get('/materiais');
  guardarTrilha(materiais);
  const concluidos = lerConcluidos();

  function desenhar() {
    const feitos = materiais.filter((material) => concluidos.has(material.id)).length;
    const percentual = materiais.length ? Math.round((feitos / materiais.length) * 100) : 0;

    render(
      el,
      html`
        <section class="cartao cartao-trilha">
          <h1 class="h5 fw-bold mb-1"><i class="bi bi-mortarboard" aria-hidden="true"></i> Trilha de capacitação</h1>
          <p class="small text-body-secondary mb-3">
            Vídeos, revistas e roteiros sobre missões e evangelismo para fortalecer o trabalho de missionários e
            igrejas. Toque em <strong>Ler no app</strong> para abrir os PDFs aqui mesmo; depois de abertos, eles ficam
            salvos no aparelho para ler sem internet.
          </p>
          <div class="d-flex justify-content-between small fw-semibold mb-1">
            <span>Seu progresso</span><span>${feitos} de ${materiais.length} concluídos</span>
          </div>
          <div class="progress" role="progressbar" aria-label="Progresso na trilha" aria-valuenow="${percentual}"
            aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar"></div>
          </div>
          ${temIgreja
            ? html`<a class="btn btn-outline-primary btn-sm mt-3" href="#/documentos">
                <i class="bi bi-folder2-open" aria-hidden="true"></i> Documentos da minha igreja
              </a>`
            : ''}
        </section>

        ${materiais.length
          ? [...agruparPorEtapa(materiais)].map(
              ([etapa, itens]) => html`
                <h2 class="dia-agenda">${etapa}</h2>
                <div class="lista">${itens.map((material) => itemMaterial(material, concluidos.has(material.id)))}</div>`,
            )
          : estadoVazio({ icone: 'mortarboard', titulo: 'Nenhum material na trilha ainda' })}

        ${podeAdicionar
          ? html`<a class="botao-flutuante" href="#/capacitacao/novo" aria-label="Adicionar material"><i class="bi bi-plus-lg"></i></a>`
          : ''}`,
    );
    el.querySelector('.progress-bar').style.width = `${percentual}%`;
  }

  el.addEventListener('click', async (evento) => {
    const caixaConcluir = evento.target.closest('[data-concluir]');
    if (caixaConcluir) {
      const id = Number(caixaConcluir.dataset.concluir);
      if (concluidos.has(id)) concluidos.delete(id);
      else concluidos.add(id);
      salvarConcluidos(concluidos);
      desenhar();
      return;
    }

    const botaoBaixar = evento.target.closest('[data-baixar]');
    if (botaoBaixar) {
      alternarEnvio(botaoBaixar, true, 'Baixando...');
      try {
        await baixarPdf(Number(botaoBaixar.dataset.baixar));
      } catch (erro) {
        avisar(erro.message, 'erro');
      } finally {
        alternarEnvio(botaoBaixar, false);
      }
      return;
    }

    const botaoExcluir = evento.target.closest('[data-excluir]');
    if (!botaoExcluir) return;
    const confirmado = await confirmar({ titulo: 'Excluir material', mensagem: 'Deseja remover este material da trilha?', botao: 'Excluir' });
    if (!confirmado) return;
    try {
      const id = Number(botaoExcluir.dataset.excluir);
      await api.del(`/materiais/${id}`);
      materiais = materiais.filter((material) => material.id !== id);
      desenhar();
      avisar('Material removido.');
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });

  desenhar();
}
