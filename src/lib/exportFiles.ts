import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import type { ReportData } from './report';
import { buildReportHtml, periodTitle, type ReportMeta } from './reportHtml';

const PDF_MIME = 'application/pdf';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CURRENCY = '"R$" #,##0.00';

const pad = (n: number) => String(n).padStart(2, '0');

/** Nome do arquivo: secure-growth-relatorio-2026-11.pdf */
export function reportFileName(data: Pick<ReportData, 'year' | 'month'>, ext: 'pdf' | 'xlsx'): string {
  return `secure-growth-relatorio-${data.year}-${pad(data.month + 1)}.${ext}`;
}

/** Abre a folha de compartilhar do celular (Salvar em Arquivos, WhatsApp, e-mail...). */
async function share(file: File, mimeType: string, title: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: title, UTI: mimeType === PDF_MIME ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet' });
}

function freshCacheFile(name: string): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  return file;
}

/** Data (dia local) como número de série do Excel, sem depender de fuso horário. */
export function excelDate(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000 + 25569;
}

/** Gera o PDF do relatório e abre o compartilhamento. */
export async function exportReportPdf(data: ReportData, meta: ReportMeta): Promise<void> {
  const html = buildReportHtml(data, meta);
  // A4 em pontos (595 x 842); o conteúdo passa para as páginas seguintes sozinho.
  const printed = await Print.printToFileAsync({ html, width: 595, height: 842 });

  const target = freshCacheFile(reportFileName(data, 'pdf'));
  new File(printed.uri).copy(target);
  await share(target, PDF_MIME, `Relatório de ${periodTitle(data.year, data.month)}`);
}

/** Monta a planilha: abas "Resumo", "Por categoria" e "Transações". */
export function buildWorkbook(data: ReportData, meta: ReportMeta): XLSX.WorkBook {
  const { summary, previous } = data;
  const wb = XLSX.utils.book_new();

  // --- Resumo
  const resumo: (string | number | null)[][] = [
    ['Secure Growth — Relatório financeiro'],
    [periodTitle(data.year, data.month)],
    [`${meta.userName} · ${meta.userEmail}`],
    [],
    ['Indicador', 'Valor'],
    ['Receitas', summary.income],
    ['Despesas', summary.expense],
    ['Resultado do mês', summary.balance],
    ['Receita guardada (%)', summary.savingsRate === null ? null : summary.savingsRate],
    ['Média de despesas por dia', data.dailyAvg],
    ['Número de transações', summary.count],
    ['Despesas do mês anterior', previous.expense],
    ['Variação das despesas (%)', data.expenseChange === null ? null : data.expenseChange / 100],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo['!cols'] = [{ wch: 32 }, { wch: 18 }];
  for (const r of [6, 7, 8, 10, 12]) setFormat(wsResumo, `B${r}`, CURRENCY);
  for (const r of [9, 13]) setFormat(wsResumo, `B${r}`, '0.0%');
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // --- Por categoria
  const cats: (string | number)[][] = [['Tipo', 'Categoria', 'Transações', 'Valor', '% do total']];
  for (const s of data.expenseByCategory) cats.push(['Despesa', s.name, s.count, s.total, s.share]);
  for (const s of data.incomeByCategory) cats.push(['Receita', s.name, s.count, s.total, s.share]);
  const wsCats = XLSX.utils.aoa_to_sheet(cats);
  wsCats['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 12 }, { wch: 16 }, { wch: 12 }];
  for (let r = 2; r <= cats.length; r++) {
    setFormat(wsCats, `D${r}`, CURRENCY);
    setFormat(wsCats, `E${r}`, '0.0%');
  }
  XLSX.utils.book_append_sheet(wb, wsCats, 'Por categoria');

  // --- Transações (valor positivo para receita, negativo para despesa)
  const txs: (string | number)[][] = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Observação']];
  for (const r of data.rows) {
    txs.push([
      excelDate(r.date),
      r.description,
      r.category,
      r.type === 'income' ? 'Receita' : 'Despesa',
      r.type === 'income' ? r.amount : -r.amount,
      r.notes,
    ]);
  }
  const wsTx = XLSX.utils.aoa_to_sheet(txs);
  wsTx['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 32 }];
  for (let r = 2; r <= txs.length; r++) {
    setFormat(wsTx, `A${r}`, 'dd/mm/yyyy');
    setFormat(wsTx, `E${r}`, CURRENCY);
  }
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transações');
  return wb;
}

function setFormat(ws: XLSX.WorkSheet, address: string, format: string) {
  const cell = ws[address];
  if (cell && (cell.t === 'n' || cell.t === 'd')) cell.z = format;
}

/** Gera a planilha Excel (.xlsx) e abre o compartilhamento. */
export async function exportReportXlsx(data: ReportData, meta: ReportMeta): Promise<void> {
  const wb = buildWorkbook(data, meta);
  const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);

  const target = freshCacheFile(reportFileName(data, 'xlsx'));
  target.create({ overwrite: true });
  await target.write(bytes);
  await share(target, XLSX_MIME, `Relatório de ${periodTitle(data.year, data.month)}`);
}

