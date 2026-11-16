// @ts-nocheck - arquivo de teste do Node (npm test); fora da checagem do app
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { digitsToCents, dayLabel, firstName, monthLong, formatAxis, formatCurrency, formatSigned, greeting } from '../src/lib/format.ts';
import {
  chartScale,
  filterTransactions,
  groupByDay,
  inMonth,
  monthChange,
  monthlySeries,
  normalize,
  totals,
} from '../src/lib/summary.ts';

const NOW = new Date(2026, 10, 14, 12, 0, 0); // 14/11/2026

const tx = (type: 'income' | 'expense', amount: number, y: number, m: number, d: number, extra = {}) => ({
  type,
  amount,
  occurred_at: new Date(y, m, d, 10, 0, 0).toISOString(),
  description: 'x',
  ...extra,
});

test('totals soma em centavos sem erro de ponto flutuante', () => {
  const t = totals([tx('income', 0.1, 2026, 10, 1), tx('income', 0.2, 2026, 10, 2), tx('expense', 0.3, 2026, 10, 3)]);
  assert.equal(t.income, 0.3);
  assert.equal(t.expense, 0.3);
  assert.equal(t.balance, 0);
});

test('totals com lista vazia', () => {
  assert.deepEqual(totals([]), { income: 0, expense: 0, balance: 0 });
});

test('inMonth filtra pelo mês local', () => {
  const list = [tx('expense', 10, 2026, 10, 1), tx('expense', 20, 2026, 9, 30)];
  assert.equal(inMonth(list, 2026, 10).length, 1);
});

test('monthlySeries devolve 6 meses, do mais antigo ao atual, atravessando o ano', () => {
  const list = [tx('income', 100, 2026, 10, 5), tx('expense', 40, 2026, 6, 5)];
  const s = monthlySeries(list, 6, NOW);
  assert.equal(s.length, 6);
  assert.deepEqual(s.map((p) => p.key), ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
  assert.equal(s[5].income, 100);
  assert.equal(s[1].expense, 40);
  const jan = monthlySeries([], 3, new Date(2026, 0, 10));
  assert.deepEqual(jan.map((p) => p.key), ['2025-11', '2025-12', '2026-01']);
});

test('monthChange compara o resultado do último mês com o anterior', () => {
  const s = monthlySeries([tx('income', 200, 2026, 9, 5), tx('income', 300, 2026, 10, 5)], 2, NOW);
  assert.equal(monthChange(s), 50);
  assert.equal(monthChange(monthlySeries([], 2, NOW)), null);
});

test('chartScale cria 4 marcas redondas', () => {
  assert.deepEqual(chartScale(5800), { max: 6000, ticks: [0, 2000, 4000, 6000] });
  assert.deepEqual(chartScale(0).ticks, [0, 100, 200, 300]);
  assert.equal(chartScale(90).max >= 90, true);
});

test('groupByDay agrupa por dia mantendo a ordem', () => {
  const list = [tx('expense', 1, 2026, 10, 14), tx('expense', 2, 2026, 10, 14), tx('expense', 3, 2026, 10, 13)];
  const g = groupByDay(list);
  assert.equal(g.length, 2);
  assert.equal(g[0].data.length, 2);
  assert.equal(g[1].key, '2026-11-13');
});

test('filterTransactions: tipo, período e busca sem acento', () => {
  const list = [
    tx('expense', 10, 2026, 10, 14, { description: 'Mercado', category: { name: 'Alimentação' } }),
    tx('income', 50, 2026, 10, 2, { description: 'Salário' }),
    tx('expense', 5, 2026, 8, 1, { description: 'Uber' }),
  ];
  assert.equal(filterTransactions(list, { type: 'income', now: NOW }).length, 1);
  assert.equal(filterTransactions(list, { period: 'month', now: NOW }).length, 2);
  assert.equal(filterTransactions(list, { period: 'lastMonth', now: NOW }).length, 0);
  assert.equal(filterTransactions(list, { period: '7d', now: NOW }).length, 1);
  assert.equal(filterTransactions(list, { query: 'alimentacao', now: NOW }).length, 1);
  assert.equal(filterTransactions(list, { query: 'SALARIO', now: NOW }).length, 1);
  assert.equal(normalize('  Ação '), 'acao');
});

test('formatadores', () => {
  assert.equal(formatCurrency(4582.3), 'R$ 4.582,30');
  assert.equal(formatCurrency(-186.4), '-R$ 186,40');
  assert.equal(formatSigned('income', 6200), '+R$ 6.200,00');
  assert.equal(formatSigned('expense', 39.9), '-R$ 39,90');
  assert.equal(digitsToCents('R$ 1,25'), 125);
  assert.equal(digitsToCents('R$ 0,005'), 5);
  assert.equal(digitsToCents(''), 0);
  assert.equal(formatAxis(2000), '2k');
  assert.equal(formatAxis(2500), '2,5k');
  assert.equal(formatAxis(800), '800');
  assert.equal(dayLabel(NOW, NOW), 'Hoje');
  assert.equal(dayLabel(new Date(2026, 10, 13), NOW), 'Ontem');
  assert.equal(dayLabel(new Date(2026, 7, 28), NOW), '28 ago');
  assert.equal(dayLabel(new Date(2025, 7, 28), NOW), '28 ago 2025');
  assert.equal(firstName('joão vitor silva'), 'João');
  assert.equal(firstName(null), '');
  assert.equal(monthLong(10), 'novembro');
  assert.equal(greeting(9), 'Bom dia');
  assert.equal(greeting(15), 'Boa tarde');
  assert.equal(greeting(21), 'Boa noite');
});
