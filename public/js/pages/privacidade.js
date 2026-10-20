import { sessao } from '../core/sessao.js';
import { html, render } from '../core/ui.js';

export default function paginaPrivacidade({ el }) {
  render(
    el,
    html`
      <div class="tela-acesso">
        <article class="cartao-acesso texto-privacidade">
          <h1 class="h4 fw-bold mb-3"><i class="bi bi-shield-check text-primary" aria-hidden="true"></i> Aviso de privacidade</h1>
          <p>
            O Projeto Missionário é um aplicativo acadêmico (Atividade Extensionista – UNINTER) criado para conectar
            igrejas e missionários de São Luís – MA.
          </p>
          <h2>Quais dados coletamos</h2>
          <p>Nome, e-mail, telefone (opcional), igreja, bairro de atuação e o que você publica na agenda e no mural.</p>
          <h2>Para que usamos</h2>
          <p>
            Apenas para a comunicação entre igrejas e missionários dentro do aplicativo. Seus contatos ficam visíveis somente
            para pessoas cadastradas.
          </p>
          <h2>O que não fazemos</h2>
          <p>Não vendemos seus dados, não os compartilhamos com terceiros e não os usamos para propaganda.</p>
          <h2>Segurança</h2>
          <p>As senhas são guardadas de forma protegida (hash bcrypt) e o acesso ao aplicativo usa conexão segura (HTTPS).</p>
          <h2>Seus direitos (LGPD)</h2>
          <p>
            Você pode corrigir seus dados a qualquer momento em "Meu perfil" e pedir a exclusão da sua conta ao administrador
            do projeto.
          </p>
          <a class="btn btn-primary w-100 mt-2" href="${sessao.logado ? '#/perfil' : '#/cadastro'}">Voltar</a>
        </article>
      </div>`,
  );
}
