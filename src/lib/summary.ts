// Cálculos puros sobre as transações (sem dependências, fáceis de testar).
// Os valores são somados em centavos para não acumular erro de arredondamento.

export type TxLike = { type: 'income' | 'expense'; amount: number; occurred_at: string };

const cents = (value: number) => Math.round(value * 100);

export type Totals = { income: number; expense: number; balance: number };

export function totals(list: TxLike[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.type === 'income') income += cents(t.amount);
    else expense += cents(t.amount);
  }
  return { income: income / 100, expense: expense / 100, balance: (income - expense) / 100 };
}

/** Transações de um mês (month: 0 a 11), pela data local. */
export function inMonth<T extends TxLike>(list: T[], year: number, month: number): T[] {
  return list.filter((t) => {
    const d = new Date(t.occurred_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export type MonthPoint = { key: string; year: number; month: number; income: number; expense: number };

/** Últimos N meses (do mais antigo ao mais recente), incluindo o atual. */
export function monthlySeries(list: TxLike[], months = 6, now: Date = new Date()): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const t = totals(inMonth(list, ref.getFullYear(), ref.getMonth()));
    points.push({
      key: `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`,
      year: ref.getFullYear(),
      month: ref.getMonth(),
      income: t.income,
      expense: t.expense,
    });
  }
  return points;
}

/** Variação (%) do resultado (receitas - despesas) do último mês contra o anterior. Null se não der para comparar. */
export function monthChange(series: MonthPoint[]): number | null {
  if (series.length < 2) return null;
  const cur = cents(series[series.length - 1].income) - cents(series[series.length - 1].expense);
  const prev = cents(series[series.length - 2].income) - cents(series[series.length - 2].expense);
  if (prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

/** Escala "bonita" para o eixo do gráfico: 4 marcas de 0 até o máximo. */
export function chartScale(maxValue: number): { max: number; ticks: number[] } {
  if (!(maxValue > 0)) return { max: 300, ticks: [0, 100, 200, 300] };
  const raw = maxValue / 3;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  return { max: step * 3, ticks: [0, step, step * 2, step * 3] };
}

export type DayGroup<T> = { key: string; date: Date; data: T[] };

/** Agrupa por dia (data local), mantendo a ordem em que as transações chegam. */
export function groupByDay<T extends { occurred_at: string }>(list: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  const index = new Map<string, DayGroup<T>>();
  for (const item of list) {
    const d = new Date(item.occurred_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let group = index.get(key);
    if (!group) {
      group = { key, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), data: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.data.push(item);
  }
  return groups;
}

export type Period = 'all' | '7d' | '30d' | 'month' | 'lastMonth';

export type TxFilter = {
  query?: string;
  type?: 'all' | 'income' | 'expense';
  period?: Period;
  now?: Date;
};

/** Tira acentos e deixa minúsculo, para a busca achar "alimentacao" em "Alimentação". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

type Searchable = TxLike & { description: string; notes?: string | null; category?: { name: string } | null };

export function filterTransactions<T extends Searchable>(list: T[], filter: TxFilter): T[] {
  const { query = '', type = 'all', period = 'all', now = new Date() } = filter;
  const q = normalize(query);

  let from: Date | null = null;
  let to: Date | null = null;
  if (period === '7d') from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  else if (period === '30d') from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  else if (period === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === 'lastMonth') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return list.filter((t) => {
    if (type !== 'all' && t.type !== type) return false;
    const d = new Date(t.occurred_at);
    if (from && d < from) return false;
    if (to && d >= to) return false;
    if (q) {
      const haystack = normalize(`${t.description} ${t.category?.name ?? ''} ${t.notes ?? ''}`);
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
