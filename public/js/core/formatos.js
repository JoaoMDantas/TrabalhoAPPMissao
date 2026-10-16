const doisDigitos = (n) => String(n).padStart(2, '0');

/** Converte "AAAA-MM-DD HH:MM:SS" (formato da API, horário local) em Date. */
export function paraData(texto) {
  const [data, horario = '00:00:00'] = texto.split(/[ T]/);
  const [ano, mes, dia] = data.split('-').map(Number);
  const [h, min, s = 0] = horario.split(':').map(Number);
  return new Date(ano, mes - 1, dia, h, min, s);
}

const comoData = (valor) => (valor instanceof Date ? valor : paraData(valor));

export const chaveDia = (data) => `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;

export const chaveMes = (data) => chaveDia(data).slice(0, 7);

export function agoraParaApi() {
  const agora = new Date();
  return `${chaveDia(agora)} ${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}`;
}

/** Valor para <input type="datetime-local">. */
export const paraCampoDataHora = (texto) => (texto ? texto.slice(0, 16).replace(' ', 'T') : '');

const formato = {
  hora: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  mesCurto: new Intl.DateTimeFormat('pt-BR', { month: 'short' }),
  mesAno: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }),
  extenso: new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  semana: new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
  curta: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
};

// Só a primeira letra: "Quinta-feira, 15 de outubro" (o CSS "capitalize" geraria "15 De Outubro").
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

export const hora = (valor) => formato.hora.format(comoData(valor));
export const mesCurto = (valor) => formato.mesCurto.format(comoData(valor)).replace('.', '');
export const mesAno = (valor) => capitalizar(formato.mesAno.format(comoData(valor)));
export const dataPorExtenso = (valor) => capitalizar(formato.extenso.format(comoData(valor)));
export const dataCurta = (valor) => formato.curta.format(comoData(valor));

export const mesmoDia = (a, b) => chaveDia(comoData(a)) === chaveDia(comoData(b));

/** "Hoje", "Amanhã" ou "sáb., 18/10". */
export function rotuloDia(valor) {
  const data = comoData(valor);
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  if (mesmoDia(data, new Date())) return 'Hoje';
  if (mesmoDia(data, amanha)) return 'Amanhã';
  return formato.semana.format(data);
}

export function tempoRelativo(valor) {
  const segundos = Math.max(0, (Date.now() - comoData(valor).getTime()) / 1000);
  if (segundos < 60) return 'agora';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
  return dataCurta(valor);
}

/** Link do WhatsApp a partir de um telefone brasileiro (acrescenta o DDI 55 quando falta). */
export function linkWhatsApp(telefone) {
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos.length <= 11 ? `55${digitos}` : digitos}`;
}

export const linkTelefone = (telefone) => `tel:${telefone.replace(/[^\d+]/g, '')}`;
