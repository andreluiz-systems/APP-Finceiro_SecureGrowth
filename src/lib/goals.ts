// Regras das metas (funções puras, sem dependências).

export type GoalLike = { target_amount: number; saved_amount: number; deadline: string | null };

const cents = (v: number) => Math.round(v * 100);

/** "AAAA-MM-DD" -> Date local (sem importar outros arquivos, para o teste rodar direto no Node). */
function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Progresso de 0 a 1 (limitado em 100%). */
export function goalProgress(g: Pick<GoalLike, 'target_amount' | 'saved_amount'>): number {
  if (!(g.target_amount > 0)) return 0;
  return Math.min(1, Math.max(0, g.saved_amount / g.target_amount));
}

export function isGoalReached(g: Pick<GoalLike, 'target_amount' | 'saved_amount'>): boolean {
  return cents(g.saved_amount) >= cents(g.target_amount);
}

/** Quanto falta para chegar na meta (nunca negativo). */
export function goalRemaining(g: Pick<GoalLike, 'target_amount' | 'saved_amount'>): number {
  return Math.max(0, cents(g.target_amount) - cents(g.saved_amount)) / 100;
}

/** Meses (inteiro, no mínimo 1) entre hoje e o prazo. Null se não há prazo ou ele já passou. */
export function monthsLeft(deadline: string | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  const end = parseDate(deadline);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (end.getTime() < startToday.getTime()) return null;
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  return Math.max(1, months);
}

/** Quanto guardar por mês para chegar no prazo. Null se não há prazo válido ou a meta já foi alcançada. */
export function monthlyNeeded(g: GoalLike, now: Date = new Date()): number | null {
  if (isGoalReached(g)) return null;
  const months = monthsLeft(g.deadline, now);
  if (months === null) return null;
  return Math.ceil(cents(goalRemaining(g)) / months) / 100;
}

/** Novo valor guardado depois de adicionar (valor positivo) ou retirar (negativo). Nunca abaixo de zero. */
export function applyDeposit(saved: number, delta: number): number {
  return Math.max(0, cents(saved) + cents(delta)) / 100;
}
