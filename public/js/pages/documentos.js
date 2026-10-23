import { abrirVisualizador } from '../components/visualizador.js';
import { api } from '../core/api.js';
import { baixarArquivo, buscarArquivo } from '../core/arquivos.js';
import { dataCurta } from '../core/formatos.js';
import { sessao } from '../core/sessao.js';
import { alternarEnvio, avisar, confirmar, estadoVazio, html, render } from '../core/ui.js';

const TIPOS_ARQUIVO = {
  pdf: { rotulo: 'PDF', icone: 'file-earmark-pdf' },
  documento: { rotulo: 'Documento', icone: 'file-earmark-word' },
  planilha: { rotulo: 'Planilha', icone: 'file-earmark-excel' },
  apresentacao: { rotulo: 'Apresentação', icone: 'file-earmark-slides' },
  imagem: { rotulo: 'Imagem', icone: 'file-earmark-image' },
};

const tamanhoLegivel = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;

const enderecoArquivo = (id) => `/api/documentos/${id}/arquivo`;

function itemDocumento(documento) {
  const tipo = TIPOS_ARQUIVO[documento.grupo] ?? TIPOS_ARQUIVO.documento;
  const abreNoApp = documento.grupo === 'pdf' || documento.grupo === 'imagem';
  return html`
    <article class="item-material">
      <span class="icone-quadrado arquivo-${documento.grupo}"><i class="bi bi-${tipo.icone}" aria-hidden="true"></i></span>
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex align-items-start gap-2">
          <h3 class="item-material-titulo flex-grow-1 mb-0">${documento.titulo}</h3>
          ${documento.pode_excluir
            ? html`<button type="button" class="btn-icone btn-icone-sm" data-excluir="${documento.id}" aria-label="Remover documento">
                <i class="bi bi-trash3"></i>
              </button>`
            : ''}
        </div>
        ${documento.descricao ? html`<p class="item-material-descricao">${documento.descricao}</p>` : ''}
        <p class="item-documento-info">
          ${tipo.rotulo} · ${tamanhoLegivel(documento.tamanho)} · ${dataCurta(documento.criado_em)} · ${documento.criado_por_nome}
        </p>
        <div class="acoes-material">
          ${documento.grupo === 'pdf'
            ? html`<a class="btn btn-primary btn-sm" href="#/documentos/${documento.id}/ler">
                <i class="bi bi-book" aria-hidden="true"></i> Ler no app
              </a>`
            : ''}
          ${documento.grupo === 'imagem'
            ? html`<button type="button" class="btn btn-primary btn-sm" data-ver="${documento.id}">
                <i class="bi bi-eye" aria-hidden="true"></i> Ver
              </button>`
            : ''}
          <button type="button" class="btn ${abreNoApp ? 'btn-outline-primary' : 'btn-primary'} btn-sm" data-baixar="${documento.id}">
            <i class="bi bi-download" aria-hidden="true"></i> Baixar
          </button>
        </div>
      </div>
    </article>`;
}

export default async function paginaDocumentos({ el, query }) {
  const usuario = sessao.usuario;
  const ehAdmin = usuario.papel === 'admin';
  const igrejaId = ehAdmin && query.igreja ? Number(query.igreja) : usuario.igreja_id;

  if (!igrejaId) {
    render(
      el,
      estadoVazio({
        icone: 'folder2-open',
        titulo: 'Você ainda não faz parte de uma igreja',
        texto: 'Escolha a sua igreja em "Meu perfil" para ver os documentos que a liderança compartilha.',
        acao: { href: '#/perfil', rotulo: 'Ir para Meu perfil' },
      }),
    );
    return;
  }

  const [igreja, primeiros] = await Promise.all([
    api.get(`/igrejas/${igrejaId}`),
    api.get('/documentos', { igreja_id: ehAdmin ? igrejaId : undefined }),
  ]);
  let documentos = primeiros;
  const podeEnviar = ehAdmin || (usuario.papel === 'lider' && usuario.igreja_id === igrejaId);

  render(
    el,
    html`
      <section class="cartao">
        <h1 class="h5 fw-bold mb-1"><i class="bi bi-folder2-open" aria-hidden="true"></i> Documentos da igreja</h1>
        <p class="small text-body-secondary mb-2">${igreja.nome}</p>
        <p class="small aviso-reservado mb-0">
          <i class="bi bi-lock" aria-hidden="true"></i> Só quem faz parte desta igreja vê estes arquivos.
        </p>
      </section>
      <div class="lista mt-3" data-lista></div>
      ${podeEnviar
        ? html`<a class="botao-flutuante" href="#/documentos/novo${ehAdmin ? `?igreja=${igrejaId}` : ''}" aria-label="Adicionar documento">
            <i class="bi bi-plus-lg"></i>
          </a>`
        : ''}`,
  );

  const lista = el.querySelector('[data-lista]');
  const desenhar = () =>
    render(
      lista,
      documentos.length
        ? documentos.map(itemDocumento)
        : estadoVazio({
            icone: 'folder2-open',
            titulo: 'Nenhum documento ainda',
            texto: podeEnviar
              ? 'Toque no + para compartilhar escalas, estudos, atas ou avisos com a sua igreja.'
              : 'Quando a liderança compartilhar arquivos com a igreja, eles aparecem aqui.',
          }),
    );
  desenhar();

  lista.addEventListener('click', async (evento) => {
    const botaoBaixar = evento.target.closest('[data-baixar]');
    if (botaoBaixar) {
      alternarEnvio(botaoBaixar, true, 'Baixando...');
      try {
        await baixarArquivo(enderecoArquivo(botaoBaixar.dataset.baixar));
      } catch (erro) {
        avisar(erro.message, 'erro');
      } finally {
        alternarEnvio(botaoBaixar, false);
      }
      return;
    }

    const botaoVer = evento.target.closest('[data-ver]');
    if (botaoVer) {
      alternarEnvio(botaoVer, true, 'Abrindo...');
      try {
        const { blob } = await buscarArquivo(enderecoArquivo(botaoVer.dataset.ver));
        const endereco = URL.createObjectURL(blob);
        const documento = documentos.find((d) => String(d.id) === botaoVer.dataset.ver);
        abrirVisualizador([{ src: endereco, alt: documento?.titulo }], 0, { aoFechar: () => URL.revokeObjectURL(endereco) });
      } catch (erro) {
        avisar(erro.message, 'erro');
      } finally {
        alternarEnvio(botaoVer, false);
      }
      return;
    }

    const botaoExcluir = evento.target.closest('[data-excluir]');
    if (!botaoExcluir) return;
    const confirmado = await confirmar({
      titulo: 'Remover documento',
      mensagem: 'O arquivo deixará de estar disponível para a igreja. Deseja remover?',
      botao: 'Remover',
    });
    if (!confirmado) return;
    try {
      const id = Number(botaoExcluir.dataset.excluir);
      await api.del(`/documentos/${id}`);
      documentos = documentos.filter((documento) => documento.id !== id);
      desenhar();
      avisar('Documento removido.');
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });
}
