import { montarLeitorPdf } from '../components/leitor-pdf.js';
import { api } from '../core/api.js';
import { buscarArquivo } from '../core/arquivos.js';
import { blocoErro, render } from '../core/ui.js';

export default async function paginaLeitorDocumento({ el, params, aoSair }) {
  const documento = await api.get(`/documentos/${params.id}`);
  if (documento.grupo !== 'pdf') {
    render(el, blocoErro({ message: 'Este documento não é um PDF. Use o botão "Baixar" na lista de documentos.' }));
    return;
  }

  // Documento reservado: não fica guardado no aparelho para leitura sem internet.
  await montarLeitorPdf(el, {
    titulo: documento.titulo,
    carregar: (opcoes) => buscarArquivo(`/api/documentos/${documento.id}/arquivo`, opcoes),
    aoSair,
  });
}
