// Cálculos do relatório mensal (funções puras, sem dependências, fáceis de testar).
// Os valores são somados em centavos para não acumular erro de arredondamento.

export type ReportTx = {
  type: 'income' | 'expense';
  amount: number;
  occurred_at: string;
  category_id?: string | null;
  category?: { id: string; name: string; icon: string } | null;
};

const cents = (v: number) => Math.round(v * 100);

/** Anda N meses a partir de (ano, mês 0-11). Ex.: (2026, 0, -1) -> dezembro de 2025. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function sameMonth(a: { year: number; month: number }, b: { year: number; month: number }): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Transações de um mês (month: 0 a 11), pela data local. */
export function txOfMonth<T extends ReportTx>(list: T[], year: number, month: number): T[] {
  return list.filter((t) => {
    const d = new Date(t.occurred_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export type MonthSummary = { income: number; expense: number; balance: number; count: number; savingsRate: number | null };

/** Totais do mês. `savingsRate` = quanto da receita sobrou (0 a 1); nulo quando não houve receita. */
export function monthSummary(list: ReportTx[]): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.type === 'income') income += cents(t.amount);
    else expense += cents(t.amount);
  }
  const balance = income - expense;
  return {
    income: income / 100,
    expense: expense / 100,
    balance: balance / 100,
    count: list.length,
    savingsRate: income > 0 ? balance / income : null,
  };
}

/** Variação em % de `current` contra `previous`. Nulo quando não dá para comparar (anterior zerado). */
export function percentChange(current: number, previous: number): number | null {
  if (cents(previous) === 0) return null;
  return ((cents(current) - cents(previous)) / Math.abs(cents(previous))) * 100;
}

export type CategorySlice = { key: string; name: string; icon: string; total: number; share: number; count: number };

/**
 * Soma por categoria de um tipo (despesa ou receita), da maior para a menor.
 * `share` é a fatia (0 a 1) do total. Passando `maxSlices`, o que sobrar vira "Outras".
 */
export function categoryBreakdown(list: ReportTx[], type: 'income' | 'expense', maxSlices = 6): CategorySlice[] {
  const map = new Map<string, { name: string; icon: string; total: number; count: number }>();
  let grand = 0;
  for (const t of list) {
    if (t.type !== type) continue;
    const key = t.category?.id ?? t.category_id ?? 'none';
    const entry = map.get(key) ?? {
      name: t.category?.name ?? 'Sem categoria',
      icon: t.category?.icon ?? 'tag-outline',
      total: 0,
      count: 0,
    };
    entry.total += cents(t.amount);
    entry.count += 1;
    grand += cents(t.amount);
    map.set(key, entry);
  }
  const sorted = [...map.entries()]
    .map(([key, e]) => ({ key, name: e.name, icon: e.icon, totalCents: e.total, count: e.count }))
    .sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name));

  const toSlice = (s: (typeof sorted)[number]): CategorySlice => ({
    key: s.key,
    name: s.name,
    icon: s.icon,
    total: s.totalCents / 100,
    share: grand > 0 ? s.totalCents / grand : 0,
    count: s.count,
  });

  if (sorted.length <= maxSlices) return sorted.map(toSlice);
  const head = sorted.slice(0, maxSlices - 1);
  const rest = sorted.slice(maxSlices - 1);
  const other = rest.reduce(
    (acc, s) => ({ ...acc, totalCents: acc.totalCents + s.totalCents, count: acc.count + s.count }),
    { key: 'others', name: 'Outras', icon: 'dots-horizontal', totalCents: 0, count: 0 },
  );
  return [...head, other].map(toSlice);
}

/** Maiores transações de um tipo no mês (as `limit` de maior valor). */
export function topTransactions<T extends ReportTx>(list: T[], type: 'income' | 'expense', limit = 3): T[] {
  return list
    .filter((t) => t.type === type)
    .sort((a, b) => cents(b.amount) - cents(a.amount) || b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, limit);
}

/** Média gasta por dia no mês (até hoje, se for o mês atual). */
export function dailyAverage(expense: number, year: number, month: number, now: Date = new Date()): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrent = now.getFullYear() === year && now.getMonth() === month;
  const days = isCurrent ? now.getDate() : daysInMonth;
  return Math.round((cents(expense) / Math.max(1, days))) / 100;
}

// ---------- Dados para exportar o relatório (PDF / Excel) ----------

export type ExportTx = ReportTx & { description: string; notes?: string | null };

export type ExportRow = {
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  notes: string;
};

export type ReportData = {
  year: number;
  month: number;
  summary: MonthSummary;
  previous: MonthSummary;
  /** variação (%) das despesas contra o mês anterior; nulo se não der para comparar */
  expenseChange: number | null;
  dailyAvg: number;
  expenseByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  /** transações do mês, da mais antiga para a mais nova */
  rows: ExportRow[];
};

/** Reúne tudo que o PDF e o Excel mostram, calculado a partir das transações. */
export function buildReportData(list: ExportTx[], year: number, month: number, now: Date = new Date()): ReportData {
  const monthTx = txOfMonth(list, year, month);
  const prev = shiftMonth(year, month, -1);
  const summary = monthSummary(monthTx);
  const previous = monthSummary(txOfMonth(list, prev.year, prev.month));
  const rows = [...monthTx]
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
    .map((t) => ({
      date: t.occurred_at,
      description: t.description,
      category: t.category?.name ?? 'Sem categoria',
      type: t.type,
      amount: t.amount,
      notes: t.notes ?? '',
    }));
  return {
    year,
    month,
    summary,
    previous,
    expenseChange: percentChange(summary.expense, previous.expense),
    dailyAvg: dailyAverage(summary.expense, year, month, now),
    expenseByCategory: categoryBreakdown(monthTx, 'expense', 999),
    incomeByCategory: categoryBreakdown(monthTx, 'income', 999),
    rows,
  };
}
