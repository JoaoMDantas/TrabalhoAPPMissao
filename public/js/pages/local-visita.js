import { montarEditorLocal } from '../components/editor-local.js';
import { tipoVisita } from '../components/visita.js';
import { api } from '../core/api.js';
import { dataCurta } from '../core/formatos.js';
import { blocoErro, render } from '../core/ui.js';

export default async function paginaLocalVisita({ el, params, navegar, aoSair }) {
  const visita = await api.get(`/visitas/${params.id}`);
  if (!visita.pode_editar) {
    render(el, blocoErro({ message: 'Você não tem permissão para alterar o local desta visita.' }));
    return;
  }

  await montarEditorLocal({
    el,
    aoSair,
    navegar,
    titulo: `${tipoVisita(visita.tipo).rotulo} · ${dataCurta(visita.data_visita)}`,
    descricao: 'Coloque o alfinete na casa, na rua ou na quadra onde a visita aconteceu.',
    latitude: visita.latitude,
    longitude: visita.longitude,
    simbolo: tipoVisita(visita.tipo).icone,
    permiteRemover: false,
    voltarPara: `/visitas/${visita.id}`,
    salvar: (local) => api.patch(`/visitas/${visita.id}/localizacao`, local),
  });
}
