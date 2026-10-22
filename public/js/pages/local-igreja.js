import { montarEditorLocal } from '../components/editor-local.js';
import { api } from '../core/api.js';
import { blocoErro, render } from '../core/ui.js';

export default async function paginaLocalIgreja({ el, params, navegar, aoSair }) {
  const igreja = await api.get(`/igrejas/${params.id}`);
  if (!igreja.pode_editar) {
    render(el, blocoErro({ message: 'Você não tem permissão para alterar o local desta igreja.' }));
    return;
  }

  await montarEditorLocal({
    el,
    aoSair,
    navegar,
    titulo: igreja.nome,
    descricao: 'Coloque o alfinete na entrada da igreja: é para lá que o "Como chegar" vai levar as pessoas.',
    latitude: igreja.latitude,
    longitude: igreja.longitude,
    simbolo: 'building',
    permiteRemover: true,
    voltarPara: `/igrejas/${igreja.id}`,
    salvar: (local) => api.patch(`/igrejas/${igreja.id}/localizacao`, local),
  });
}
