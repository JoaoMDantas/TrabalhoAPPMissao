import { z } from 'zod';

z.config(z.locales.pt());

export { z };

const vazioParaNulo = (valor) =>
  valor === undefined || (typeof valor === 'string' && valor.trim() === '') ? null : valor;

/** Campo opcional: ausente ou texto vazio vira null; caso contrário, aplica o esquema. */
export const opcional = (esquema) => z.preprocess(vazioParaNulo, esquema.nullable());

export const id = z.coerce.number().int().positive();

export const paramsComId = z.object({ id });

export const textoOpcional = (maximo) =>
  opcional(z.string().trim().max(maximo, `Use no máximo ${maximo} caracteres.`));

export const telefoneOpcional = opcional(
  z.string().trim().regex(/^[0-9()+\-\s]{8,20}$/, 'Telefone inválido. Use apenas números, espaços, parênteses ou hífen.'),
);

/** Coordenada do mapa em graus decimais, arredondada a 6 casas (cerca de 10 cm). */
const grausDecimais = (limite, mensagem) =>
  z
    .number({ error: mensagem })
    .min(-limite, mensagem)
    .max(limite, mensagem)
    .transform((valor) => Math.round(valor * 1e6) / 1e6);

// O formulário envia texto: vazio vira null (opcional) ou ausente (obrigatório); o resto vira número.
const coordenadaOpcional = (limite, mensagem) =>
  z.preprocess((valor) => (vazioParaNulo(valor) === null ? null : Number(valor)), grausDecimais(limite, mensagem).nullable());
const coordenadaObrigatoria = (limite, mensagem) =>
  z.preprocess((valor) => (vazioParaNulo(valor) === null ? undefined : Number(valor)), grausDecimais(limite, mensagem));

export const latitude = coordenadaOpcional(90, 'Latitude inválida.');
export const longitude = coordenadaOpcional(180, 'Longitude inválida.');
export const latitudeObrigatoria = coordenadaObrigatoria(90, 'Marque o local no mapa.');
export const longitudeObrigatoria = coordenadaObrigatoria(180, 'Marque o local no mapa.');

/** Latitude e longitude andam juntas: as duas preenchidas ou as duas vazias. */
export const coordenadasCompletas = [
  (dados) => (dados.latitude === null) === (dados.longitude === null),
  { message: 'Marque a localização no mapa novamente.', path: ['latitude'] },
];

export const emailObrigatorio = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .max(120, 'Use no máximo 120 caracteres.')
  .email('Informe um e-mail válido.');

export const emailOpcional = opcional(emailObrigatorio);

// O bcrypt considera apenas os primeiros 72 bytes da senha.
export const senhaNova = z
  .string({ error: 'Informe a senha.' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.');

const PADRAO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const PADRAO_DATA_HORA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/;

/** Confere se a data existe no calendário (ex.: rejeita 31/02 e 25:00). */
function existeNoCalendario(valor) {
  const [data, hora = '00:00:00'] = valor.split(/[T ]/);
  const [ano, mes, dia] = data.split('-').map(Number);
  const [h, min, s = 0] = hora.split(':').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia, h, min, s));
  return (
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia &&
    d.getUTCHours() === h &&
    d.getUTCMinutes() === min &&
    d.getUTCSeconds() === s
  );
}

/** Aceita "AAAA-MM-DDTHH:MM" (campo datetime-local) e devolve "AAAA-MM-DD HH:MM:SS". */
export const dataHora = z
  .string()
  .trim()
  .regex(PADRAO_DATA_HORA, 'Data e hora inválidas.')
  .refine(existeNoCalendario, 'Data e hora inválidas.')
  .transform((valor) => {
    const normalizado = valor.replace('T', ' ');
    return normalizado.length === 16 ? `${normalizado}:00` : normalizado;
  });

/** Data "AAAA-MM-DD" (campo date), conferida no calendário. */
export const data = z
  .string({ error: 'Informe a data.' })
  .trim()
  .refine((valor) => PADRAO_DATA.test(valor) && existeNoCalendario(valor), 'Data inválida.');

/** Filtro de período: aceita só a data ("AAAA-MM-DD") ou data e hora. */
export const dataOuDataHora = z
  .string()
  .trim()
  .refine((valor) => (PADRAO_DATA.test(valor) || PADRAO_DATA_HORA.test(valor)) && existeNoCalendario(valor), 'Data inválida.')
  .transform((valor) => valor.replace('T', ' '));
