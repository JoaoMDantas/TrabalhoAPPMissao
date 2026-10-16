import { linkTelefone, linkWhatsApp } from '../core/formatos.js';
import { html } from '../core/ui.js';

export function botoesContato({ telefone, email }, classeExtra = '') {
  if (!telefone && !email) return html`<p class="small text-body-secondary mb-0">Nenhum contato informado.</p>`;
  const whatsapp = telefone ? linkWhatsApp(telefone) : null;

  return html`
    <div class="botoes-contato ${classeExtra}">
      ${telefone
        ? html`<a class="btn btn-outline-primary btn-sm" href="${linkTelefone(telefone)}">
            <i class="bi bi-telephone" aria-hidden="true"></i> Ligar
          </a>`
        : ''}
      ${whatsapp
        ? html`<a class="btn btn-success btn-sm" href="${whatsapp}" target="_blank" rel="noopener">
            <i class="bi bi-whatsapp" aria-hidden="true"></i> WhatsApp
          </a>`
        : ''}
      ${email
        ? html`<a class="btn btn-outline-secondary btn-sm" href="mailto:${email}">
            <i class="bi bi-envelope" aria-hidden="true"></i> E-mail
          </a>`
        : ''}
    </div>`;
}
