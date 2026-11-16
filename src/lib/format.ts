/** Formata número como moeda brasileira: 1234.5 -> "R$ 1.234,50" */
export function formatCurrency(value: number): string {
  const negative = value < 0;
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$ ${withDots},${dec}`;
}

/** Moeda sem centavos, para espaços curtos: 4582.3 -> "R$ 4.582" */
export function formatCurrencyShort(value: number): string {
  const negative = value < 0;
  const int = Math.round(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$ ${int}`;
}

/** Valor com sinal para listas: receita "+R$ 10,00", despesa "-R$ 10,00" */
export function formatSigned(type: 'income' | 'expense', amount: number): string {
  return `${type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(amount))}`;
}

/** Centavos (inteiro) para moeda: 18640 -> "R$ 186,40" */
export function formatCents(cents: number): string {
  return formatCurrency(cents / 100);
}

/** Pega só os dígitos digitados e devolve centavos: "R$ 1,25" -> 125. Limita o tamanho. */
export function digitsToCents(text: string, maxDigits = 10): number {
  const digits = text.replace(/\D/g, '').slice(0, maxDigits);
  return digits ? parseInt(digits, 10) : 0;
}

/** Eixo de gráfico: 2000 -> "2k", 2500 -> "2,5k", 800 -> "800" */
export function formatAxis(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1).replace('.', ',')}k`;
  }
  return String(Math.round(value));
}

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function monthShort(monthIndex: number): string {
  return MONTHS_SHORT[monthIndex] ?? '';
}

const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function monthLong(monthIndex: number): string {
  return MONTHS_LONG[monthIndex] ?? '';
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 14/08/2026 */
export function formatDate(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** 18:40 */
export function formatTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 14/08/2026, 18:40 */
export function formatDateTime(d: Date): string {
  return `${formatDate(d)}, ${formatTime(d)}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isYesterday(d: Date, now: Date): boolean {
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return sameDay(d, y);
}

/** "Hoje", "Ontem", "28 ago" ou "28 ago 2025" (outro ano) */
export function dayLabel(d: Date, now: Date = new Date()): string {
  if (sameDay(d, now)) return 'Hoje';
  if (isYesterday(d, now)) return 'Ontem';
  const base = `${d.getDate()} ${monthShort(d.getMonth())}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "Hoje, 14:32", "Ontem, 09:00", "28 ago, 20:10" */
export function relativeDateTime(d: Date, now: Date = new Date()): string {
  return `${dayLabel(d, now)}, ${formatTime(d)}`;
}

/** Primeiro nome com a inicial maiúscula: "joão vitor silva" -> "João" */
export function firstName(full: string | null | undefined): string {
  const first = (full ?? '').trim().split(/\s+/)[0] ?? '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
}

export function greeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Máscara de telefone brasileiro enquanto digita: "61999998888" -> "(61) 99999-8888". */
export function formatPhone(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Telefone vazio é aceito (campo opcional); preenchido precisa ter DDD + 8 ou 9 dígitos. */
export function isValidPhone(text: string): boolean {
  const n = text.replace(/\D/g, '').length;
  return n === 0 || n === 10 || n === 11;
}
