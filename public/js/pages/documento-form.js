import { enviarFormulario } from '../core/arquivos.js';
import { sessao } from '../core/sessao.js';
import { alternarEnvio, avisar, blocoErro, html, limparErrosFormulario, mostrarErroFormulario, render } from '../core/ui.js';

const LIMITE_MB = 10;
const ACEITOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp';

export default async function paginaNovoDocumento({ el, query, navegar }) {
  const usuario = sessao.usuario;
  const ehAdmin = usuario.papel === 'admin';
  const igrejaId = ehAdmin && query.igreja ? Number(query.igreja) : usuario.igreja_id;

  if (!igrejaId || !(ehAdmin || usuario.papel === 'lider')) {
    render(el, blocoErro({ message: 'Apenas a liderança da igreja pode adicionar documentos.' }));
    return;
  }

  const voltarPara = ehAdmin ? `/documentos?igreja=${igrejaId}` : '/documentos';
  render(
    el,
    html`
      <form class="cartao" novalidate>
        <div class="alert alert-danger d-none" data-erro role="alert"></div>
        ${ehAdmin ? html`<input type="hidden" name="igreja_id" value="${igrejaId}">` : ''}

        <div class="mb-3">
          <label class="form-label" for="titulo">Título</label>
          <input class="form-control" id="titulo" name="titulo" maxlength="150" required placeholder="Ex.: Escala de louvor de novembro">
        </div>
        <div class="mb-3">
          <label class="form-label" for="descricao">Descrição <span class="text-body-secondary">(opcional)</span></label>
          <textarea class="form-control" id="descricao" name="descricao" rows="2" maxlength="500"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label" for="arquivo">Arquivo</label>
          <input class="form-control" id="arquivo" name="arquivo" type="file" accept="${ACEITOS}" required>
          <div class="form-text">PDF, Word, Excel, PowerPoint ou imagem, com até ${LIMITE_MB} MB.</div>
        </div>
        <p class="small aviso-reservado mb-4">
          <i class="bi bi-lock" aria-hidden="true"></i> O documento ficará visível só para quem faz parte da igreja.
        </p>

        <button class="btn btn-primary w-100" type="submit">Adicionar documento</button>
      </form>`,
  );

  const form = el.querySelector('form');
  const campoArquivo = form.elements.namedItem('arquivo');

  // Sugere o título a partir do nome do arquivo, se a pessoa ainda não escreveu um.
  campoArquivo.addEventListener('change', () => {
    const titulo = form.elements.namedItem('titulo');
    const arquivo = campoArquivo.files[0];
    if (arquivo && !titulo.value.trim()) titulo.value = arquivo.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 150);
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErrosFormulario(form);
    const arquivo = campoArquivo.files[0];
    if (!arquivo) {
      mostrarErroFormulario(form, { detalhes: [{ campo: 'arquivo', mensagem: 'Escolha o arquivo do documento.' }] });
      return;
    }
    if (arquivo.size > LIMITE_MB * 1024 * 1024) {
      mostrarErroFormulario(form, { detalhes: [{ campo: 'arquivo', mensagem: `O arquivo passa de ${LIMITE_MB} MB.` }] });
      return;
    }

    const botao = form.querySelector('[type="submit"]');
    alternarEnvio(botao, true, 'Enviando...');
    try {
      await enviarFormulario('/documentos', new FormData(form), {
        aoProgredir: (enviados, total) => (botao.lastChild.textContent = `Enviando ${Math.round((enviados / total) * 100)}%`),
      });
      avisar('Documento adicionado.');
      navegar(voltarPara, { substituir: true });
    } catch (erro) {
      mostrarErroFormulario(form, erro);
    } finally {
      alternarEnvio(botao, false);
    }
  });
}
