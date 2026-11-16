// Monta o HTML do relatório em PDF. Sem dependências, para poder testar direto no Node.
import type { ReportData } from './report';

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Escapa texto digitado pelo usuário (nome de transação, categoria...) para não virar HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function brl(value: number): string {
  const negative = value < 0;
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  return `${negative ? '-' : ''}R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function periodTitle(year: number, month: number): string {
  const name = MONTHS[month] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

const pct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`;

function categoryTable(title: string, slices: ReportData['expenseByCategory'], color: string): string {
  if (slices.length === 0) return '';
  const rows = slices
    .map(
      (s) => `<tr>
        <td>${escapeHtml(s.name)}</td>
        <td class="r">${s.count}</td>
        <td class="r">${brl(s.total)}</td>
        <td class="r">${pct(s.share * 100)}</td>
        <td class="bar"><div style="width:${Math.max(2, Math.round(s.share * 100))}%;background:${color}"></div></td>
      </tr>`,
    )
    .join('');
  return `<h2>${escapeHtml(title)}</h2>
    <table><thead><tr><th>Categoria</th><th class="r">Qtd.</th><th class="r">Valor</th><th class="r">%</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

export type ReportMeta = { userName: string; userEmail: string; generatedAt: Date };

export function buildReportHtml(data: ReportData, meta: ReportMeta): string {
  const { summary, rows } = data;
  const g = meta.generatedAt;
  const generated = `${pad(g.getDate())}/${pad(g.getMonth() + 1)}/${g.getFullYear()} ${pad(g.getHours())}:${pad(g.getMinutes())}`;

  const savings =
    summary.savingsRate === null
      ? 'Sem receitas no mês'
      : summary.savingsRate >= 0
        ? `${pct(summary.savingsRate * 100)} da receita guardada`
        : `${pct(Math.abs(summary.savingsRate) * 100)} a mais do que recebeu`;

  const change =
    data.expenseChange === null
      ? '—'
      : `${data.expenseChange > 0 ? '+' : data.expenseChange < 0 ? '-' : ''}${pct(Math.abs(data.expenseChange))}`;

  const txRows = rows
    .map(
      (r) => `<tr>
        <td>${shortDate(r.date)}</td>
        <td>${escapeHtml(r.description)}${r.notes ? `<div class="note">${escapeHtml(r.notes)}</div>` : ''}</td>
        <td>${escapeHtml(r.category)}</td>
        <td class="r ${r.type}">${r.type === 'income' ? '+' : '-'}${brl(Math.abs(r.amount))}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1A0B2E; margin: 0; padding: 28px; font-size: 11px; }
  header { background: #6C2BD9; color: #fff; border-radius: 14px; padding: 18px 20px; }
  header h1 { margin: 0; font-size: 20px; }
  header p { margin: 4px 0 0; opacity: .85; }
  .meta { margin: 10px 2px 0; color: #6b6780; font-size: 10px; }
  .grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .tile { flex: 1 1 30%; background: #EEEDFE; border-radius: 10px; padding: 10px 12px; }
  .tile small { color: #6b6780; display: block; }
  .tile b { font-size: 14px; display: block; margin-top: 3px; }
  .income { color: #16A34A; }
  .expense { color: #6C2BD9; }
  h2 { font-size: 14px; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; color: #6b6780; border-bottom: 1px solid #d9d4ee; padding: 6px 4px; }
  td { padding: 7px 4px; border-bottom: 1px solid #ece9f7; vertical-align: top; }
  .r { text-align: right; white-space: nowrap; }
  .bar { width: 22%; } .bar div { height: 6px; border-radius: 3px; }
  .note { color: #6b6780; font-size: 9px; margin-top: 2px; }
  tr { page-break-inside: avoid; }
  footer { margin-top: 24px; color: #6b6780; font-size: 9px; text-align: center; }
</style></head><body>
<header><h1>Relatório financeiro</h1><p>${escapeHtml(periodTitle(data.year, data.month))}</p></header>
<p class="meta">${escapeHtml(meta.userName)} · ${escapeHtml(meta.userEmail)} · Gerado em ${generated}</p>

<div class="grid">
  <div class="tile"><small>Receitas</small><b class="income">${brl(summary.income)}</b></div>
  <div class="tile"><small>Despesas</small><b>${brl(summary.expense)}</b></div>
  <div class="tile"><small>Resultado do mês</small><b>${brl(summary.balance)}</b></div>
  <div class="tile"><small>Poupança</small><b>${escapeHtml(savings)}</b></div>
  <div class="tile"><small>Média de despesas por dia</small><b>${brl(data.dailyAvg)}</b></div>
  <div class="tile"><small>Despesas vs. mês anterior</small><b>${change}</b></div>
</div>

${categoryTable('Despesas por categoria', data.expenseByCategory, '#FF8186')}
${categoryTable('Receitas por categoria', data.incomeByCategory, '#48DD9F')}

<h2>Transações do mês (${summary.count})</h2>
${
  rows.length === 0
    ? '<p>Nenhuma transação neste mês.</p>'
    : `<table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th class="r">Valor</th></tr></thead><tbody>${txRows}</tbody></table>`
}
<footer>Secure Growth · relatório gerado automaticamente a partir das suas transações</footer>
</body></html>`;
}
