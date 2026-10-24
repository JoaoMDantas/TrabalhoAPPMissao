let pedidoInstalacao = null;
const CHAVE_DICA = 'pm.dicaInstalar';

export function registrarPwa() {
  // Service workers exigem HTTPS ou localhost; em http na rede local o app funciona, só não fica disponível offline.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((erro) => console.warn('Service worker não registrado:', erro));
    });
  }

  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    pedidoInstalacao = evento;
  });
  window.addEventListener('appinstalled', () => {
    pedidoInstalacao = null;
  });
}

export const podeInstalar = () => Boolean(pedidoInstalacao);

export async function instalar() {
  if (!pedidoInstalacao) return false;
  pedidoInstalacao.prompt();
  const { outcome } = await pedidoInstalacao.userChoice;
  pedidoInstalacao = null;
  return outcome === 'accepted';
}

/** "iphone", "android" ou null (computador). O iPad recente se apresenta como Mac, mas tem tela de toque. */
export function sistemaDoCelular() {
  const agente = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(agente) || (/Macintosh/.test(agente) && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/.test(agente)) return 'android';
  return null;
}

/** O app foi aberto pelo ícone da tela inicial (instalado), e não pelo navegador. */
export const estaInstalado = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// A dica de instalação da tela inicial pode ser fechada; a escolha vale só para este aparelho.
export function dicaDispensada() {
  try {
    return localStorage.getItem(CHAVE_DICA) === 'dispensada';
  } catch {
    return false;
  }
}

export function dispensarDica() {
  try {
    localStorage.setItem(CHAVE_DICA, 'dispensada');
  } catch {
    // Sem armazenamento: a dica volta a aparecer na próxima visita.
  }
}
