// @ts-nocheck
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyDeposit, goalProgress, goalRemaining, isGoalReached, monthlyNeeded, monthsLeft } from '../src/lib/goals.ts';
import {
  daysUntil,
  dueLabel,
  filterReminders,
  notificationTimes,
  overdueReminders,
  reminderState,
  sumAmount,
  toDueDate,
} from '../src/lib/reminders.ts';

const now = new Date(2026, 10, 14, 15, 30); // 14/11/2026 15:30

const r = (id, due_date, status = 'pending', paid_at = null) => ({ id, due_date, status, paid_at, amount: 10 });

test('daysUntil conta dias pelo calendário local', () => {
  assert.equal(daysUntil('2026-11-14', now), 0);
  assert.equal(daysUntil('2026-11-15', now), 1);
  assert.equal(daysUntil('2026-11-13', now), -1);
  assert.equal(daysUntil('2026-12-01', now), 17);
});

test('toDueDate formata pela data local', () => {
  assert.equal(toDueDate(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('reminderState e dueLabel', () => {
  assert.equal(reminderState(r('a', '2026-11-10'), now), 'overdue');
  assert.equal(reminderState(r('a', '2026-11-14'), now), 'today');
  assert.equal(reminderState(r('a', '2026-11-17'), now), 'soon');
  assert.equal(reminderState(r('a', '2026-11-18'), now), 'upcoming');
  assert.equal(reminderState(r('a', '2026-11-01', 'paid'), now), 'paid');
  assert.equal(dueLabel('2026-11-14', now), 'Vence hoje');
  assert.equal(dueLabel('2026-11-15', now), 'Vence amanhã');
  assert.equal(dueLabel('2026-11-20', now), 'Vence em 6 dias');
  assert.equal(dueLabel('2026-11-13', now), 'Atrasado há 1 dia');
  assert.equal(dueLabel('2026-11-10', now), 'Atrasado há 4 dias');
});

test('abas: todos, esta semana e pagos', () => {
  const list = [
    r('longe', '2026-12-10'),
    r('atrasado', '2026-11-10'),
    r('semana', '2026-11-20'),
    r('fora', '2026-11-21'),
    r('pago-antigo', '2026-10-01', 'paid', '2026-10-01T10:00:00Z'),
    r('pago-novo', '2026-11-05', 'paid', '2026-11-05T10:00:00Z'),
  ];
  assert.deepEqual(filterReminders(list, 'todos', now).map((x) => x.id), ['atrasado', 'semana', 'fora', 'longe']);
  assert.deepEqual(filterReminders(list, 'semana', now).map((x) => x.id), ['atrasado', 'semana']);
  assert.deepEqual(filterReminders(list, 'pagos', now).map((x) => x.id), ['pago-novo', 'pago-antigo']);
  assert.deepEqual(overdueReminders(list, now).map((x) => x.id), ['atrasado']);
});

test('sumAmount não acumula erro de ponto flutuante', () => {
  assert.equal(sumAmount([{ amount: 0.1 }, { amount: 0.2 }]), 0.3);
});

test('notificationTimes: 3 dias antes e no dia, só no futuro', () => {
  const far = notificationTimes('2026-11-30', now);
  assert.equal(far.length, 2);
  assert.equal(toDueDate(far[0].date), '2026-11-27');
  assert.equal(far[0].date.getHours(), 9);
  assert.equal(toDueDate(far[1].date), '2026-11-30');
  // vence em 2 dias: o aviso de 3 dias antes já passou
  const near = notificationTimes('2026-11-16', now);
  assert.deepEqual(near.map((x) => x.kind), ['today']);
  // vence hoje, mas já são 15h30: nada a avisar
  assert.equal(notificationTimes('2026-11-14', now).length, 0);
});

test('metas: progresso, falta e alcançada', () => {
  const g = { target_amount: 1000, saved_amount: 250, deadline: null };
  assert.equal(goalProgress(g), 0.25);
  assert.equal(goalRemaining(g), 750);
  assert.equal(isGoalReached(g), false);
  assert.equal(isGoalReached({ ...g, saved_amount: 1000 }), true);
  assert.equal(goalProgress({ target_amount: 100, saved_amount: 150 }), 1);
  assert.equal(goalRemaining({ target_amount: 100, saved_amount: 150 }), 0);
});

test('metas: valor mensal necessário', () => {
  assert.equal(monthsLeft('2027-02-14', now), 3);
  assert.equal(monthsLeft('2026-11-20', now), 1);
  assert.equal(monthsLeft('2026-11-01', now), null);
  assert.equal(monthsLeft(null, now), null);
  assert.equal(monthlyNeeded({ target_amount: 1000, saved_amount: 250, deadline: '2027-02-14' }, now), 250);
  assert.equal(monthlyNeeded({ target_amount: 1000, saved_amount: 1000, deadline: '2027-02-14' }, now), null);
  assert.equal(monthlyNeeded({ target_amount: 1000, saved_amount: 0, deadline: null }, now), null);
});

test('applyDeposit soma, subtrai e nunca fica negativo', () => {
  assert.equal(applyDeposit(10.1, 0.2), 10.3);
  assert.equal(applyDeposit(50, -80), 0);
});
