const CHAVE_TOKEN = 'pm.token';
const CHAVE_USUARIO = 'pm.usuario';
const CHAVE_DESTINO = 'pm.destino';

// O armazenamento pode estar bloqueado (ex.: navegação anônima); nesse caso a sessão vale só enquanto a aba estiver aberta.
function ler(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    // Sem armazenamento disponível: a sessão continua em memória.
  }
}

function lerUsuario() {
  try {
    return JSON.parse(ler(CHAVE_USUARIO));
  } catch {
    return null;
  }
}

let token = ler(CHAVE_TOKEN);
let usuario = lerUsuario();

export const sessao = {
  get token() {
    return token;
  },

  get usuario() {
    return usuario;
  },

  get logado() {
    return Boolean(token && usuario);
  },

  iniciar(novoToken, novoUsuario) {
    token = novoToken;
    gravar(CHAVE_TOKEN, novoToken);
    this.atualizarUsuario(novoUsuario);
  },

  atualizarUsuario(novoUsuario) {
    usuario = novoUsuario;
    gravar(CHAVE_USUARIO, JSON.stringify(novoUsuario));
  },

  encerrar() {
    token = null;
    usuario = null;
    gravar(CHAVE_TOKEN, null);
    gravar(CHAVE_USUARIO, null);
  },

  /** Guarda a tela que a pessoa tentou abrir sem estar logada (ex.: o link de um evento recebido no WhatsApp). */
  guardarDestino(caminho) {
    try {
      sessionStorage.setItem(CHAVE_DESTINO, caminho);
    } catch {
      // Sem armazenamento: depois do login, a pessoa vai para o início.
    }
  },

  /** Devolve a tela guardada, uma única vez, para abri-la logo depois do login. */
  tomarDestino() {
    try {
      const caminho = sessionStorage.getItem(CHAVE_DESTINO);
      sessionStorage.removeItem(CHAVE_DESTINO);
      return caminho;
    } catch {
      return null;
    }
  },
};
