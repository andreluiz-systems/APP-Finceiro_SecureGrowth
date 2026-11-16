// Regras dos lembretes (funções puras, sem dependências, fáceis de testar).
// As datas de vencimento vêm do banco como "AAAA-MM-DD" (sem horário).

export type ReminderLike = { id: string; due_date: string; status: 'pending' | 'paid'; paid_at?: string | null };

/** Quantos dias antes do vencimento o aviso é disparado. */
export const NOTIFY_DAYS_BEFORE = 3;

/** "2026-11-20" -> Date local à meia-noite (evita o erro de fuso de `new Date('2026-11-20')`). */
export function parseDueDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date -> "AAAA-MM-DD" pela data local. */
export function toDueDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Dias entre hoje e o vencimento: 0 = hoje, negativo = atrasado. */
export function daysUntil(dueDate: string, now: Date = new Date()): number {
  const diff = parseDueDate(dueDate).getTime() - startOfDay(now).getTime();
  return Math.round(diff / 86_400_000);
}

export type ReminderState = 'paid' | 'overdue' | 'today' | 'soon' | 'upcoming';

/** Situação do lembrete: pago, atrasado, vence hoje, vence em até 3 dias ou ainda longe. */
export function reminderState(r: ReminderLike, now: Date = new Date()): ReminderState {
  if (r.status === 'paid') return 'paid';
  const days = daysUntil(r.due_date, now);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= NOTIFY_DAYS_BEFORE) return 'soon';
  return 'upcoming';
}

/** Texto curto do prazo: "Vence hoje", "Vence amanhã", "Vence em 5 dias", "Atrasado há 2 dias". */
export function dueLabel(dueDate: string, now: Date = new Date()): string {
  const days = daysUntil(dueDate, now);
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  if (days > 1) return `Vence em ${days} dias`;
  if (days === -1) return 'Atrasado há 1 dia';
  return `Atrasado há ${Math.abs(days)} dias`;
}

export type ReminderTab = 'todos' | 'semana' | 'pagos';

/** Filtra e ordena para cada aba. Pendentes: do mais urgente ao mais distante. Pagos: do mais recente. */
export function filterReminders<T extends ReminderLike>(list: T[], tab: ReminderTab, now: Date = new Date()): T[] {
  const byDue = (a: T, b: T) => a.due_date.localeCompare(b.due_date);
  if (tab === 'pagos') {
    return list
      .filter((r) => r.status === 'paid')
      .sort((a, b) => (b.paid_at ?? b.due_date).localeCompare(a.paid_at ?? a.due_date));
  }
  const pending = list.filter((r) => r.status === 'pending').sort(byDue);
  // "Esta semana": atrasados + os que vencem de hoje até 6 dias à frente.
  return tab === 'semana' ? pending.filter((r) => daysUntil(r.due_date, now) <= 6) : pending;
}

export function overdueReminders<T extends ReminderLike>(list: T[], now: Date = new Date()): T[] {
  return list.filter((r) => r.status === 'pending' && daysUntil(r.due_date, now) < 0);
}

/** Soma em centavos (sem erro de arredondamento) e devolve em reais. */
export function sumAmount(list: { amount: number }[]): number {
  return list.reduce((acc, r) => acc + Math.round(r.amount * 100), 0) / 100;
}

/**
 * Quando disparar os avisos de um lembrete: N dias antes e no dia do vencimento, às 9h.
 * Só devolve datas que ainda não passaram.
 */
export function notificationTimes(dueDate: string, now: Date = new Date(), hour = 9): { date: Date; kind: 'before' | 'today' }[] {
  const due = parseDueDate(dueDate);
  const before = new Date(due.getFullYear(), due.getMonth(), due.getDate() - NOTIFY_DAYS_BEFORE, hour);
  const today = new Date(due.getFullYear(), due.getMonth(), due.getDate(), hour);
  return [
    { date: before, kind: 'before' as const },
    { date: today, kind: 'today' as const },
  ].filter((t) => t.date.getTime() > now.getTime());
}
