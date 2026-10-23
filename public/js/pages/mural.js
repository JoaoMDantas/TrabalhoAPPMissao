import { itemMensagem } from '../components/mensagem.js';
import { api } from '../core/api.js';
import { enviarFormulario } from '../core/arquivos.js';
import { reduzirFoto } from '../core/imagens.js';
import { sessao } from '../core/sessao.js';
import {
  alternarEnvio,
  avisar,
  blocoErro,
  carregando,
  confirmar,
  estadoVazio,
  html,
  limparErrosFormulario,
  mostrarErroFormulario,
  opcoesIgrejas,
  render,
} from '../core/ui.js';

const POR_PAGINA = 20;
const LIMITE_CARACTERES = 1000;
const MAXIMO_FOTOS = 4;

export default async function paginaMural({ el, aoSair }) {
  const podePublicarAviso = sessao.usuario.papel !== 'missionario';
  let filtroTipo = '';
  let mensagens = [];
  let fotosEscolhidas = []; // { arquivo, previa }: a prévia é um endereço temporário (blob:) da foto

  render(
    el,
    html`
      <form class="cartao compositor" novalidate>
        <label class="visually-hidden" for="conteudo">Mensagem</label>
        <textarea class="form-control" id="conteudo" name="conteudo" rows="3" maxlength="${LIMITE_CARACTERES}"
          placeholder="Compartilhe uma notícia, um pedido de oração, fotos ou um link do YouTube..."></textarea>
        <div class="previas-fotos" data-previas hidden></div>
        <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
          <button type="button" class="btn btn-light btn-sm" data-escolher-fotos>
            <i class="bi bi-image" aria-hidden="true"></i> Fotos
          </button>
          <input type="file" accept="image/*" multiple hidden data-fotos aria-label="Escolher fotos">
          <label class="visually-hidden" for="igreja_id">Igreja relacionada</label>
          <select class="form-select form-select-sm w-auto mw-100" id="igreja_id" name="igreja_id" data-igrejas>
            <option value="">Para todos</option>
          </select>
          ${podePublicarAviso
            ? html`<div class="form-check form-switch mb-0">
                <input class="form-check-input" type="checkbox" role="switch" id="aviso" name="aviso">
                <label class="form-check-label small" for="aviso">Publicar como aviso</label>
              </div>`
            : ''}
          <span class="ms-auto small text-body-secondary" data-contador aria-live="polite">0/${LIMITE_CARACTERES}</span>
          <button class="btn btn-primary btn-sm" type="submit"><i class="bi bi-send" aria-hidden="true"></i> Publicar</button>
        </div>
      </form>

      <div class="filtros-chips mt-3" role="group" aria-label="Filtrar mensagens">
        <button type="button" class="chip ativo" data-filtro="">Tudo</button>
        <button type="button" class="chip" data-filtro="aviso"><i class="bi bi-megaphone" aria-hidden="true"></i> Avisos</button>
      </div>

      <div class="lista" data-lista>${carregando()}</div>
      <div class="text-center mt-3">
        <button type="button" class="btn btn-outline-primary btn-sm" data-mais hidden>Carregar mais</button>
      </div>`,
  );

  const form = el.querySelector('form');
  const campoTexto = form.elements.conteudo;
  const lista = el.querySelector('[data-lista]');
  const botaoMais = el.querySelector('[data-mais]');

  api
    .get('/igrejas/opcoes')
    .then((igrejas) => render(el.querySelector('[data-igrejas]'), opcoesIgrejas(igrejas, null, 'Para todos')))
    .catch(() => {});

  function desenhar() {
    render(
      lista,
      mensagens.length
        ? mensagens.map((mensagem) => itemMensagem(mensagem))
        : estadoVazio({
            icone: 'chat-square-text',
            titulo: filtroTipo ? 'Nenhum aviso publicado' : 'Nenhuma mensagem ainda',
            texto: filtroTipo ? '' : 'Seja o primeiro a compartilhar algo com a comunidade.',
          }),
    );
  }

  async function carregar({ continuar = false } = {}) {
    const pagina = await api.get('/mural', {
      tipo: filtroTipo,
      limite: POR_PAGINA,
      antes_de: continuar ? mensagens.at(-1)?.id : undefined,
    });
    mensagens = continuar ? [...mensagens, ...pagina] : pagina;
    botaoMais.hidden = pagina.length < POR_PAGINA;
    desenhar();
  }

  campoTexto.addEventListener('input', () => {
    el.querySelector('[data-contador]').textContent = `${campoTexto.value.length}/${LIMITE_CARACTERES}`;
  });

  // --- Fotos escolhidas para a nova mensagem ---
  const entradaFotos = el.querySelector('[data-fotos]');
  const previas = el.querySelector('[data-previas]');

  function desenharPrevias() {
    previas.hidden = !fotosEscolhidas.length;
    render(
      previas,
      fotosEscolhidas.map(
        (foto, i) => html`
          <div class="previa-foto">
            <img src="${foto.previa}" alt="Foto ${i + 1} escolhida">
            <button type="button" class="previa-remover" data-remover-foto="${i}" aria-label="Remover a foto ${i + 1}">
              <i class="bi bi-x"></i>
            </button>
          </div>`,
      ),
    );
  }

  function limparFotos() {
    fotosEscolhidas.forEach((foto) => URL.revokeObjectURL(foto.previa));
    fotosEscolhidas = [];
    desenharPrevias();
  }
  aoSair(limparFotos);

  el.querySelector('[data-escolher-fotos]').addEventListener('click', () => entradaFotos.click());
  entradaFotos.addEventListener('change', () => {
    const novas = [...entradaFotos.files].filter((arquivo) => arquivo.type.startsWith('image/'));
    const vagas = MAXIMO_FOTOS - fotosEscolhidas.length;
    if (novas.length > vagas) avisar(`Cada mensagem pode ter no máximo ${MAXIMO_FOTOS} fotos.`, 'erro');
    fotosEscolhidas.push(...novas.slice(0, vagas).map((arquivo) => ({ arquivo, previa: URL.createObjectURL(arquivo) })));
    entradaFotos.value = '';
    desenharPrevias();
  });
  previas.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-remover-foto]');
    if (!botao) return;
    const [removida] = fotosEscolhidas.splice(Number(botao.dataset.removerFoto), 1);
    URL.revokeObjectURL(removida.previa);
    desenharPrevias();
  });

  /** Com fotos, envia como formulário (reduzindo cada foto no aparelho antes); sem fotos, como antes. */
  async function publicar(dados, botao) {
    if (!fotosEscolhidas.length) return api.post('/mural', dados);
    const formulario = new FormData();
    for (const [campo, valor] of Object.entries(dados)) formulario.append(campo, valor);
    for (const [i, foto] of fotosEscolhidas.entries()) {
      botao.lastChild.textContent = `Preparando foto ${i + 1} de ${fotosEscolhidas.length}`;
      formulario.append('fotos', await reduzirFoto(foto.arquivo), `foto-${i + 1}.jpg`);
    }
    return enviarFormulario('/mural', formulario, {
      aoProgredir: (enviados, total) => (botao.lastChild.textContent = `Enviando ${Math.round((enviados / total) * 100)}%`),
    });
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true);
    try {
      const nova = await publicar(
        {
          conteudo: campoTexto.value,
          igreja_id: form.elements.igreja_id.value,
          tipo: form.elements.aviso?.checked ? 'aviso' : 'mensagem',
        },
        botao,
      );
      form.reset();
      limparFotos();
      el.querySelector('[data-contador]').textContent = `0/${LIMITE_CARACTERES}`;
      if (!filtroTipo || filtroTipo === nova.tipo) {
        mensagens = [nova, ...mensagens];
        desenhar();
      }
      avisar('Mensagem publicada!');
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });

  el.querySelectorAll('[data-filtro]').forEach((chip) => {
    chip.addEventListener('click', async () => {
      if (chip.dataset.filtro === filtroTipo) return;
      filtroTipo = chip.dataset.filtro;
      el.querySelectorAll('[data-filtro]').forEach((outro) => outro.classList.toggle('ativo', outro === chip));
      render(lista, carregando());
      await carregar().catch((erro) => render(lista, blocoErro(erro)));
    });
  });

  botaoMais.addEventListener('click', async () => {
    alternarEnvio(botaoMais, true);
    await carregar({ continuar: true }).catch((erro) => avisar(erro.message, 'erro'));
    alternarEnvio(botaoMais, false);
  });

  lista.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-excluir]');
    if (!botao) return;
    const confirmado = await confirmar({ titulo: 'Excluir mensagem', mensagem: 'Deseja excluir esta mensagem?', botao: 'Excluir' });
    if (!confirmado) return;

    try {
      const id = Number(botao.dataset.excluir);
      await api.del(`/mural/${id}`);
      mensagens = mensagens.filter((mensagem) => mensagem.id !== id);
      desenhar();
      avisar('Mensagem excluída.');
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });

  await carregar();
}
