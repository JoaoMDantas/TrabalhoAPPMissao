let pedidoInstalacao = null;

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
