import { botoesContato } from '../components/contato.js';
import { itemEvento } from '../components/evento.js';
import { api } from '../core/api.js';
import { agoraParaApi, linkWhatsApp } from '../core/formatos.js';
import { PAPEIS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import { avatar, avisar, confirmar, estadoVazio, html, render } from '../core/ui.js';

function caixaSenhaTemporaria(pessoa, senha) {
  const mensagem =
    `Olá, ${pessoa.nome.split(' ')[0]}! Sua senha temporária no Projeto Missionário é: ${senha}\n` +
    `Entre em ${window.location.origin} e troque a senha em Meu perfil > Alterar senha.`;
  const whatsapp = pessoa.telefone ? linkWhatsApp(pessoa.telefone) : null;

  return html`
    <div class="cartao cartao-senha mt-3" role="status">
      <div class="small">Senha temporária de <strong>${pessoa.nome}</strong>:</div>
      <div class="senha-temporaria">${senha}</div>
      <div class="small text-body-secondary mb-2">
        Ela aparece só agora. Envie para a pessoa e peça que troque em Meu perfil → Alterar senha.
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-outline-primary btn-sm" data-acao="copiar-senha">
          <i class="bi bi-clipboard" aria-hidden="true"></i> Copiar
        </button>
        ${whatsapp
          ? html`<a class="btn btn-success btn-sm" href="${whatsapp}?text=${encodeURIComponent(mensagem)}" target="_blank" rel="noopener">
              <i class="bi bi-whatsapp" aria-hidden="true"></i> Enviar pelo WhatsApp
            </a>`
          : ''}
      </div>
    </div>`;
}

export default async function paginaPessoa({ el, params }) {
  const id = Number(params.id);
  const [pessoa, eventos] = await Promise.all([
    api.get(`/usuarios/${id}`),
    api.get('/eventos', { criado_por: id, de: agoraParaApi(), limite: 5 }),
  ]);
  const ehEu = pessoa.id === sessao.usuario.id;
  const ehAdmin = sessao.usuario.papel === 'admin';

  render(
    el,
    html`
      <section class="cartao text-center">
        ${avatar(pessoa.nome, 'lg')}
        <h1 class="h4 fw-bold mt-3 mb-1">${pessoa.nome}</h1>
        <span class="badge rounded-pill papel-${pessoa.papel}">${PAPEIS[pessoa.papel]}</span>

        <ul class="lista-info text-start mt-3">
          <li>
            <i class="bi bi-building" aria-hidden="true"></i>
            ${pessoa.igreja_id
              ? html`<a href="#/igrejas/${pessoa.igreja_id}">${pessoa.igreja_nome}</a>`
              : html`<span class="text-body-secondary">Sem igreja informada</span>`}
          </li>
          <li>
            <i class="bi bi-geo-alt" aria-hidden="true"></i>
            ${pessoa.bairro_atuacao
              ? html`<span>Atua em ${pessoa.bairro_atuacao}</span>`
              : html`<span class="text-body-secondary">Bairro de atuação não informado</span>`}
          </li>
          <li><i class="bi bi-envelope" aria-hidden="true"></i><span class="text-break">${pessoa.email}</span></li>
        </ul>
        ${pessoa.sobre ? html`<p class="texto-livre text-start mt-2 mb-0">${pessoa.sobre}</p>` : ''}
        <div class="mt-3">${botoesContato(pessoa, 'justify-content-center')}</div>
      </section>

      ${ehEu
        ? html`<a class="btn btn-outline-primary w-100 mt-3" href="#/perfil"><i class="bi bi-pencil" aria-hidden="true"></i> Editar meu perfil</a>`
        : ''}
      ${ehAdmin
        ? html`<div data-area-senha>
            <button type="button" class="btn btn-outline-secondary w-100 mt-3" data-acao="redefinir-senha">
              <i class="bi bi-key" aria-hidden="true"></i> Redefinir senha (administrador)
            </button>
          </div>`
        : ''}

      <div class="secao-titulo"><h2>Próximas atividades organizadas</h2></div>
      <div class="lista">
        ${eventos.length
          ? eventos.map((evento) => itemEvento(evento))
          : estadoVazio({ icone: 'calendar-x', titulo: 'Nenhuma atividade agendada' })}
      </div>`,
  );

  const areaSenha = el.querySelector('[data-area-senha]');
  if (!areaSenha) return;

  let senhaGerada = '';
  areaSenha.addEventListener('click', async (evento) => {
    if (evento.target.closest('[data-acao="copiar-senha"]')) {
      try {
        await navigator.clipboard.writeText(senhaGerada);
        avisar('Senha copiada.');
      } catch {
        avisar('Não foi possível copiar. Anote a senha mostrada na tela.', 'erro');
      }
      return;
    }

    if (!evento.target.closest('[data-acao="redefinir-senha"]')) return;
    const confirmado = await confirmar({
      titulo: 'Redefinir senha',
      mensagem: `Gerar uma senha temporária para ${pessoa.nome}? A senha atual deixará de funcionar.`,
      botao: 'Gerar senha',
    });
    if (!confirmado) return;

    try {
      const { senha_temporaria: senha } = await api.post(`/usuarios/${pessoa.id}/redefinir-senha`);
      senhaGerada = senha;
      render(areaSenha, caixaSenhaTemporaria(pessoa, senha));
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });
}
