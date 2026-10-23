import * as servico from './mural.service.js';

export async function listar(req, res) {
  res.json(await servico.listar(req.usuario, req.valido.query));
}

export async function criar(req, res) {
  res.status(201).json(await servico.criar(req.usuario, req.valido.body, req.files ?? []));
}

export async function foto(req, res) {
  const { tipo_mime: tipo, conteudo } = await servico.abrirFoto(req.valido.params.id, req.valido.query);
  res.set({
    'Content-Type': tipo,
    'Content-Length': String(conteudo.length),
    // O endereço muda quando o link vence; até lá, o aparelho reaproveita a foto já baixada.
    'Cache-Control': 'private, max-age=86400',
  });
  res.end(conteudo);
}

export async function excluir(req, res) {
  await servico.excluir(req.usuario, req.valido.params.id);
  res.status(204).end();
}
