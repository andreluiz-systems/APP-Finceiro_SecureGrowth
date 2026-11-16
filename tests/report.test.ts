// @ts-nocheck
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  categoryBreakdown,
  dailyAverage,
  monthSummary,
  percentChange,
  shiftMonth,
  topTransactions,
  txOfMonth,
} from '../src/lib/report.ts';

const tx = (type, amount, y, m, d, cat) => ({
  type,
  amount,
  occurred_at: new Date(y, m, d, 12).toISOString(),
  category: cat ? { id: cat, name: cat, icon: 'tag-outline' } : null,
});

test('shiftMonth atravessa o ano', () => {
  assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
  assert.deepEqual(shiftMonth(2026, 10, 2), { year: 2027, month: 0 });
  assert.deepEqual(shiftMonth(2026, 5, 0), { year: 2026, month: 5 });
});

test('txOfMonth e monthSummary', () => {
  const list = [tx('income', 1000, 2026, 10, 3), tx('expense', 0.1, 2026, 10, 4), tx('expense', 0.2, 2026, 10, 5), tx('expense', 50, 2026, 9, 5)];
  const nov = txOfMonth(list, 2026, 10);
  assert.equal(nov.length, 3);
  const s = monthSummary(nov);
  assert.equal(s.income, 1000);
  assert.equal(s.expense, 0.3);
  assert.equal(s.balance, 999.7);
  assert.equal(s.count, 3);
  assert.ok(Math.abs(s.savingsRate - 0.9997) < 1e-9);
  assert.equal(monthSummary([tx('expense', 10, 2026, 10, 1)]).savingsRate, null);
});

test('percentChange', () => {
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(50, 100), -50);
  assert.equal(percentChange(10, 0), null);
});

test('categoryBreakdown: ordena, calcula fatias e agrupa o resto em "Outras"', () => {
  const list = [
    tx('expense', 300, 2026, 10, 1, 'Mercado'),
    tx('expense', 100, 2026, 10, 2, 'Mercado'),
    tx('expense', 100, 2026, 10, 3, 'Lazer'),
    tx('expense', 50, 2026, 10, 4, 'Transporte'),
    tx('expense', 30, 2026, 10, 5, 'Saúde'),
    tx('expense', 20, 2026, 10, 6, null),
    tx('income', 5000, 2026, 10, 7, 'Salário'),
  ];
  const all = categoryBreakdown(list, 'expense', 10);
  assert.deepEqual(all.map((s) => s.name), ['Mercado', 'Lazer', 'Transporte', 'Saúde', 'Sem categoria']);
  assert.equal(all[0].total, 400);
  assert.equal(all[0].count, 2);
  assert.equal(all[0].share, 400 / 600);
  assert.ok(Math.abs(all.reduce((a, s) => a + s.share, 0) - 1) < 1e-9);

  const grouped = categoryBreakdown(list, 'expense', 3);
  assert.deepEqual(grouped.map((s) => s.name), ['Mercado', 'Lazer', 'Outras']);
  assert.equal(grouped[2].total, 100);
  assert.equal(grouped[2].count, 3);

  assert.deepEqual(categoryBreakdown([], 'expense'), []);
});

test('topTransactions', () => {
  const list = [tx('expense', 10, 2026, 10, 1), tx('expense', 90, 2026, 10, 2), tx('expense', 50, 2026, 10, 3), tx('income', 999, 2026, 10, 4)];
  assert.deepEqual(topTransactions(list, 'expense', 2).map((t) => t.amount), [90, 50]);
});

test('dailyAverage: mês atual usa os dias já decorridos', () => {
  const now = new Date(2026, 10, 10, 15);
  assert.equal(dailyAverage(100, 2026, 10, now), 10);
  assert.equal(dailyAverage(300, 2026, 8, now), 10); // setembro tem 30 dias
});

import { formatPhone, isValidPhone } from '../src/lib/format.ts';

test('telefone: máscara e validação', () => {
  assert.equal(formatPhone(''), '');
  assert.equal(formatPhone('6'), '(6');
  assert.equal(formatPhone('61999'), '(61) 999');
  assert.equal(formatPhone('6199999888'), '(61) 9999-9888');
  assert.equal(formatPhone('61999998888'), '(61) 99999-8888');
  assert.equal(formatPhone('(61) 99999-8888 12345'), '(61) 99999-8888');
  assert.equal(isValidPhone(''), true);
  assert.equal(isValidPhone('(61) 99999-8888'), true);
  assert.equal(isValidPhone('(61) 9999-8888'), true);
  assert.equal(isValidPhone('(61) 999'), false);
});

import { buildReportData } from '../src/lib/report.ts';
import { brl, buildReportHtml, escapeHtml, periodTitle } from '../src/lib/reportHtml.ts';

test('buildReportData: totais, categorias e linhas em ordem cronológica', () => {
  const t = (type, amount, d, cat, description, notes) => ({ ...tx(type, amount, 2026, 10, d, cat), description, notes });
  const list = [
    t('expense', 100, 5, 'Mercado', 'Feira', null),
    t('income', 1000, 1, 'Salário', 'Salário', 'novembro'),
    t('expense', 50, 3, 'Mercado', 'Padaria', null),
    { ...tx('expense', 200, 2026, 9, 10, 'Mercado'), description: 'Outubro' },
  ];
  const data = buildReportData(list, 2026, 10, new Date(2026, 10, 10));
  assert.equal(data.summary.income, 1000);
  assert.equal(data.summary.expense, 150);
  assert.equal(data.previous.expense, 200);
  assert.equal(data.expenseChange, -25);
  assert.equal(data.dailyAvg, 15);
  assert.deepEqual(data.rows.map((r) => r.description), ['Salário', 'Padaria', 'Feira']);
  assert.equal(data.rows[0].notes, 'novembro');
  assert.equal(data.expenseByCategory[0].total, 150);
});

test('PDF: escapa HTML digitado pelo usuário e formata valores', () => {
  assert.equal(escapeHtml(`<img src=x onerror="a()">&'`), '&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;');
  assert.equal(brl(1234.5), 'R$ 1.234,50');
  assert.equal(periodTitle(2026, 10), 'Novembro de 2026');
  const list = [{ ...tx('expense', 10, 2026, 10, 2, 'Mercado'), description: '<script>alert(1)</script>', notes: null }];
  const html = buildReportHtml(buildReportData(list, 2026, 10), { userName: 'André <b>', userEmail: 'a@b.com', generatedAt: new Date(2026, 10, 14, 9, 5) });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('André &lt;b&gt;'));
  assert.ok(html.includes('Gerado em 14/11/2026 09:05'));
  assert.ok(html.includes('Despesas por categoria'));
});

import { parseAuthLink, parseOAuthReturn } from '../src/lib/authLink.ts';

test('login social: lê o retorno do navegador e não confunde com link de e-mail', () => {
  assert.deepEqual(parseOAuthReturn('exp://192.168.1.9:8081/--/entrar-google?code=abc123'), { kind: 'code', code: 'abc123' });
  assert.deepEqual(parseOAuthReturn('securegrowth://entrar-google?error=access_denied&error_description=User+cancelled'), {
    kind: 'error',
    message: 'User cancelled',
  });
  assert.deepEqual(parseOAuthReturn('securegrowth://entrar-google'), { kind: 'none' });
  // o retorno do Google nunca é tratado como recuperação de senha
  assert.equal(parseAuthLink('exp://192.168.1.9:8081/--/entrar-google?code=abc123').kind, 'none');
  assert.equal(parseAuthLink('securegrowth://entrar-google?error=access_denied').kind, 'none');
  // e o link de recuperação continua funcionando
  assert.equal(parseAuthLink('exp://192.168.1.9:8081/--/nova-senha?code=xyz').kind, 'recoveryCode');
  assert.equal(parseAuthLink('exp://x/--/nova-senha#error=access_denied&error_code=otp_expired').kind, 'error');
});
