import { api } from '../core/api.js';
import { TIPOS_MATERIAL } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import { avisar, confirmar, estadoVazio, html, render } from '../core/ui.js';

// O progresso de estudo é pessoal e fica salvo apenas neste aparelho.
const chaveProgresso = () => `pm.capacitacao.${sessao.usuario.id}`;

function lerConcluidos() {
  try {
    return new Set(JSON.parse(localStorage.getItem(chaveProgresso())) ?? []);
  } catch {
    return new Set();
  }
}

function salvarConcluidos(ids) {
  try {
    localStorage.setItem(chaveProgresso(), JSON.stringify([...ids]));
  } catch {
    // Sem armazenamento disponível: o progresso vale só enquanto a tela estiver aberta.
  }
}

function agruparPorEtapa(materiais) {
  const grupos = new Map();
  for (const material of materiais) {
    if (!grupos.has(material.etapa)) grupos.set(material.etapa, []);
    grupos.get(material.etapa).push(material);
  }
  return grupos;
}

function itemMaterial(material, concluido) {
  const tipo = TIPOS_MATERIAL[material.tipo] ?? TIPOS_MATERIAL.link;
  return html`
    <article class="item-material ${concluido ? 'concluido' : ''}">
      <span class="icone-quadrado tipo-material-${material.tipo}"><i class="bi bi-${tipo.icone}" aria-hidden="true"></i></span>
      <div class="flex-grow-1 min-w-0">
        <a class="item-material-titulo" href="${material.url}" target="_blank" rel="noopener">
          ${material.titulo} <i class="bi bi-box-arrow-up-right small" aria-hidden="true"></i>
        </a>
        ${material.descricao ? html`<p class="item-material-descricao">${material.descricao}</p>` : ''}
        <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
          <span class="badge rounded-pill text-bg-light">${tipo.rotulo}</span>
          <button type="button" class="btn btn-sm ${concluido ? 'btn-success' : 'btn-outline-success'}"
            data-concluir="${material.id}" aria-pressed="${concluido}">
            <i class="bi bi-${concluido ? 'check-circle-fill' : 'circle'}" aria-hidden="true"></i>
            ${concluido ? 'Concluído' : 'Marcar como concluído'}
          </button>
          ${material.pode_excluir
            ? html`<button type="button" class="btn-icone btn-icone-sm ms-auto" data-excluir="${material.id}" aria-label="Excluir material">
                <i class="bi bi-trash3"></i>
              </button>`
            : ''}
        </div>
      </div>
    </article>`;
}

export default async function paginaCapacitacao({ el }) {
  const podeAdicionar = sessao.usuario.papel !== 'missionario';
  let materiais = await api.get('/materiais');
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
            Vídeos, cartilhas e cursos selecionados para fortalecer o trabalho de missionários e igrejas.
            Abra cada material e marque quando concluir.
          </p>
          <div class="d-flex justify-content-between small fw-semibold mb-1">
            <span>Seu progresso</span><span>${feitos} de ${materiais.length} concluídos</span>
          </div>
          <div class="progress" role="progressbar" aria-label="Progresso na trilha" aria-valuenow="${percentual}"
            aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar"></div>
          </div>
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
    const botaoConcluir = evento.target.closest('[data-concluir]');
    if (botaoConcluir) {
      const id = Number(botaoConcluir.dataset.concluir);
      if (concluidos.has(id)) concluidos.delete(id);
      else concluidos.add(id);
      salvarConcluidos(concluidos);
      desenhar();
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
