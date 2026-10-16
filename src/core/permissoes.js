export const PAPEIS = Object.freeze({
  ADMIN: 'admin',
  LIDER: 'lider',
  MISSIONARIO: 'missionario',
});

export const ehAdmin = (usuario) => usuario.papel === PAPEIS.ADMIN;

export const ehLiderDaIgreja = (usuario, igrejaId) =>
  usuario.papel === PAPEIS.LIDER && igrejaId != null && usuario.igreja_id === igrejaId;

/**
 * Regra geral de edição: o admin pode tudo; o autor pode alterar o que criou;
 * o líder pode alterar o que estiver vinculado à sua igreja.
 */
export function podeGerenciar(usuario, { autorId = null, igrejaId = null } = {}) {
  return ehAdmin(usuario) || (autorId != null && usuario.id === autorId) || ehLiderDaIgreja(usuario, igrejaId);
}
