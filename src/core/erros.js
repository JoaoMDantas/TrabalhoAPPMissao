export class AppError extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
    this.detalhes = detalhes;
  }
}

export const erros = {
  requisicaoInvalida: (mensagem = 'Requisição inválida.', detalhes) => new AppError(400, mensagem, detalhes),
  naoAutenticado: (mensagem = 'Você precisa entrar na sua conta.') => new AppError(401, mensagem),
  semPermissao: (mensagem = 'Você não tem permissão para realizar esta ação.') => new AppError(403, mensagem),
  naoEncontrado: (mensagem = 'Registro não encontrado.') => new AppError(404, mensagem),
  conflito: (mensagem = 'Este registro já existe.') => new AppError(409, mensagem),
};
