import { sessao } from '../core/sessao.js';
import { html, render } from '../core/ui.js';

export default function paginaPrivacidade({ el }) {
  render(
    el,
    html`
      <div class="tela-acesso">
        <article class="cartao-acesso texto-privacidade">
          <h1 class="h4 fw-bold mb-3"><i class="bi bi-shield-check text-primary" aria-hidden="true"></i> Aviso de privacidade</h1>
          <p>O Projeto Missionário é um aplicativo criado para conectar igrejas e missionários de São Luís – MA.</p>
          <h2>Quais dados coletamos</h2>
          <p>
            Nome, e-mail, telefone (opcional), igreja, bairro de atuação e o que você publica na agenda, no mural (inclusive
            fotos), nos comentários e no mapa de visitas, além das suas curtidas e das presenças que você confirma nos
            eventos.
          </p>
          <h2>Para que usamos</h2>
          <p>
            Apenas para a comunicação entre igrejas e missionários dentro do aplicativo. Seus contatos, comentários, curtidas e
            presenças confirmadas (com o seu nome) ficam visíveis somente para pessoas cadastradas.
          </p>
          <h2>Mapa de visitas e localização</h2>
          <p>
            Cada visita guarda só o local marcado no mapa, o tipo, a situação, a data e quantas pessoas foram alcançadas.
            Não registre nomes, telefones, fotos ou detalhes que identifiquem os moradores. A localização do celular só é
            usada quando você toca no botão de localização, para marcar o ponto; o aplicativo não acompanha onde você está.
          </p>
          <h2>Fotos e documentos</h2>
          <p>
            As fotos do mural são reduzidas no seu celular antes do envio, o que também apaga a localização gravada nelas, e
            só pessoas cadastradas as veem. Publique fotos de pessoas, principalmente de crianças, apenas com a autorização
            delas ou dos responsáveis. Os documentos que a liderança compartilha com a igreja ficam visíveis só para quem faz
            parte dela.
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
